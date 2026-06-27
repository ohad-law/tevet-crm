import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("tiktok");

    // Fetch user profile info and stats
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,avatar_url_100,display_name,follower_count,following_count,likes_count,video_count',
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const profileData = await profileRes.json();

    if (profileData.error && profileData.error.code !== 'ok') {
      return Response.json({ error: profileData.error.message || 'TikTok API error' }, { status: 400 });
    }

    const userInfo = profileData.data?.user || {};

    // Fetch recent videos (up to 10)
    let videos = [];
    try {
      const videoRes = await fetch(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,view_count,like_count,comment_count,share_count,create_time',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_count: 10 }),
        }
      );
      const videoData = await videoRes.json();
      if (videoData.data?.videos) {
        videos = videoData.data.videos.map((v) => ({
          id: v.id,
          title: v.title || '',
          description: v.video_description || '',
          cover_url: v.cover_image_url || '',
          embed_link: v.embed_link || '',
          views: v.view_count || 0,
          likes: v.like_count || 0,
          comments: v.comment_count || 0,
          shares: v.share_count || 0,
          duration: v.duration || 0,
          created: v.create_time || 0,
        }));
      }
    } catch {
      // Videos fetch is optional — don't fail the whole request
    }

    return Response.json({
      profile: {
        display_name: userInfo.display_name || '',
        avatar_url: userInfo.avatar_url_100 || userInfo.avatar_url || '',
        bio: '',
        is_verified: false,
        profile_url: '',
        follower_count: userInfo.follower_count || 0,
        following_count: userInfo.following_count || 0,
        likes_count: userInfo.likes_count || 0,
        video_count: userInfo.video_count || 0,
      },
      videos,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});