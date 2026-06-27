import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { action, data } = await req.json();

        // --- ANALYZE VIDEO CREATIVE (Thumb-stop & Hold rate) ---
        if (action === 'analyze_video') {
            const { ad } = data;
            const ins = ad.insights?.data?.[0] || {};
            
            const impressions = parseInt(ins.impressions || 0);
            const getActionValue = (key) => {
                const arr = ins[key];
                return arr?.[0]?.value ? parseInt(arr[0].value) : 0;
            };
            
            const videoPlays = getActionValue('video_play_actions');
            const p25 = getActionValue('video_p25_watched_actions');
            const p50 = getActionValue('video_p50_watched_actions');
            const p75 = getActionValue('video_p75_watched_actions');
            const p100 = getActionValue('video_p100_watched_actions');
            const avgWatch = getActionValue('video_avg_time_watched_actions');

            // Thumb-stop = 3-sec video views / impressions
            const thumbStopRate = impressions > 0 ? (videoPlays / impressions * 100) : 0;
            // Hold rate = p25 / p100 reached (engagement retention)
            const holdRate = videoPlays > 0 ? (p100 / videoPlays * 100) : 0;
            const p25Rate = videoPlays > 0 ? (p25 / videoPlays * 100) : 0;
            const p50Rate = videoPlays > 0 ? (p50 / videoPlays * 100) : 0;
            const p75Rate = videoPlays > 0 ? (p75 / videoPlays * 100) : 0;

            // Identify the drop-off point
            let dropOffPoint = 'עד הסוף';
            if (p25Rate < 50) dropOffPoint = 'בין 0 ל-25% (שנייה 0-4)';
            else if (p50Rate < 40) dropOffPoint = 'בין 25% ל-50% (אמצע הסרטון הראשון)';
            else if (p75Rate < 30) dropOffPoint = 'בין 50% ל-75% (לפני ה-CTA)';
            else if (holdRate < 20) dropOffPoint = 'בין 75% לסוף (לפני הקריאה לפעולה)';

            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `אתה אנליסט פרסום וידאו מומחה. נתח את מטריקות הסרטון הבא והצע המלצות:

מודעה: "${ad.name}"
קופי: "${ad.creative?.body || 'N/A'}"

מטריקות:
- Thumb-stop rate: ${thumbStopRate.toFixed(2)}% (benchmark: 25%+)
- Hold rate (עד הסוף): ${holdRate.toFixed(2)}% (benchmark: 15%+)
- % שצפו ב-25%: ${p25Rate.toFixed(1)}%
- % שצפו ב-50%: ${p50Rate.toFixed(1)}%
- % שצפו ב-75%: ${p75Rate.toFixed(1)}%
- זמן צפייה ממוצע: ${avgWatch} שניות
- נקודת נטישה עיקרית: ${dropOffPoint}

תן ניתוח קצר (3-5 שורות) + 3 המלצות ספציפיות לשיפור הסרטון.
ענה בעברית בלבד.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        diagnosis: { type: "string", description: "אבחנה כללית של הסרטון" },
                        recommendations: { 
                            type: "array", 
                            items: { type: "string" },
                            description: "3 המלצות ספציפיות"
                        },
                        severity: { type: "string", enum: ["good", "warning", "critical"] }
                    }
                }
            });

            return Response.json({
                success: true,
                metrics: {
                    thumb_stop_rate: thumbStopRate,
                    hold_rate: holdRate,
                    p25_rate: p25Rate,
                    p50_rate: p50Rate,
                    p75_rate: p75Rate,
                    avg_watch_seconds: avgWatch,
                    drop_off_point: dropOffPoint
                },
                ai: aiAnalysis
            });
        }

        // --- AD SCHEDULING OPTIMIZATION ---
        if (action === 'schedule_optimization') {
            const { hourly } = data;
            
            // Aggregate by hour
            const byHour = {};
            hourly.forEach(h => {
                const hour = h.hourly_stats_aggregated_by_advertiser_time_zone || 'unknown';
                if (!byHour[hour]) byHour[hour] = { spend: 0, clicks: 0, impressions: 0, leads: 0 };
                byHour[hour].spend += parseFloat(h.spend || 0);
                byHour[hour].clicks += parseInt(h.clicks || 0);
                byHour[hour].impressions += parseInt(h.impressions || 0);
                const leadAction = h.actions?.find(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead');
                byHour[hour].leads += leadAction ? parseInt(leadAction.value) : 0;
            });

            const hoursData = Object.entries(byHour).map(([hour, d]) => ({
                hour,
                ...d,
                cpl: d.leads > 0 ? d.spend / d.leads : null,
                ctr: d.impressions > 0 ? (d.clicks / d.impressions * 100) : 0
            }));

            const sortedByCPL = hoursData.filter(h => h.cpl !== null).sort((a, b) => a.cpl - b.cpl);
            const bestHours = sortedByCPL.slice(0, 5);
            const worstHours = sortedByCPL.slice(-3);

            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `אתה מומחה אופטימיזציה של מדיה ממומנת. הנה נתוני ביצועים לפי שעות:

${JSON.stringify(hoursData.slice(0, 24), null, 2)}

תן 3 המלצות קונקרטיות לגבי חלונות זמן לפרסום (Ad Scheduling). ענה בעברית.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        best_windows: { type: "array", items: { type: "string" } },
                        avoid_windows: { type: "array", items: { type: "string" } },
                        recommendation: { type: "string" }
                    }
                }
            });

            return Response.json({
                success: true,
                hours_data: hoursData,
                best_hours: bestHours,
                worst_hours: worstHours,
                ai: aiAnalysis
            });
        }

        // --- COPY OPTIMIZATION - Generate 3 A/B variations ---
        if (action === 'copy_variations') {
            const { winning_ads } = data;
            
            const copies = winning_ads.map(a => ({
                title: a.creative?.title || '',
                body: a.creative?.body || '',
                ctr: parseFloat(a.insights?.data?.[0]?.ctr || 0)
            })).filter(c => c.body);

            const aiResult = await base44.integrations.Core.InvokeLLM({
                prompt: `אתה קופירייטר מומחה לשיווק במדיה ממומנת. אלו המודעות המנצחות שלי (עם CTR גבוה):

${copies.map((c, i) => `מודעה ${i+1} (CTR: ${c.ctr}%):\nכותרת: ${c.title}\nגוף: ${c.body}`).join('\n\n')}

1. זהה את התבניות הפסיכולוגיות שעובדות (כאב, הוכחה חברתית, FOMO, וכו')
2. צור 3 גרסאות חדשות ל-A/B Test שיכולות לשפר את ה-CTR עוד יותר
3. כל גרסה חייבת להיות שונה מהותית מהשנייה (זווית שונה)

ענה בעברית.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        patterns_identified: { 
                            type: "array", 
                            items: { type: "string" }
                        },
                        variations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    angle: { type: "string" },
                                    title: { type: "string" },
                                    body: { type: "string" },
                                    cta: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            return Response.json({ success: true, ...aiResult });
        }

        // --- AD FATIGUE DETECTION (smart alerts) ---
        if (action === 'fatigue_detection') {
            const { ads } = data;
            const alerts = [];

            ads.forEach(ad => {
                const ins = ad.insights?.data?.[0];
                if (!ins) return;

                const frequency = parseFloat(ins.frequency || 0);
                const ctr = parseFloat(ins.ctr || 0);
                const cpc = parseFloat(ins.cpc || 0);
                const spend = parseFloat(ins.spend || 0);

                let severity = null;
                let reason = null;
                let action_recommended = null;

                if (frequency > 5) {
                    severity = 'critical';
                    reason = `תדירות גבוהה מאוד (${frequency.toFixed(1)}) - הקהל רואה את המודעה יותר מ-5 פעמים`;
                    action_recommended = 'כיבוי מיידי והחלפת קריאייטיב';
                } else if (frequency > 3 && ctr < 1) {
                    severity = 'warning';
                    reason = `תדירות ${frequency.toFixed(1)} עם CTR נמוך (${ctr.toFixed(2)}%) - המודעה נשחקת`;
                    action_recommended = 'רענון קריאייטיב מומלץ';
                } else if (cpc > 10 && spend > 100) {
                    severity = 'warning';
                    reason = `עלות להקלקה גבוהה (₪${cpc.toFixed(2)}) עם הוצאה ניכרת`;
                    action_recommended = 'בדוק ויזואל או הגדרות קהל';
                }

                if (severity) {
                    alerts.push({
                        ad_id: ad.id,
                        ad_name: ad.name,
                        severity,
                        reason,
                        action_recommended,
                        metrics: { frequency, ctr, cpc, spend }
                    });
                }
            });

            return Response.json({ success: true, alerts });
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('FB Ads AI Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});