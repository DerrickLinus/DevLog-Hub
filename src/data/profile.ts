export interface SocialLink {
  label: string;
  url: string;
}

export const profile = {
  name: '你的名字',
  siteName: '我的技术博客',
  bio: '这里写一句简短介绍，说明你专注的技术方向。',
  avatar: '', // 头像图片路径，例如 /avatar.png，留空则显示首字母占位
  social: [
    { label: 'GitHub', url: 'https://github.com/yourname' },
    { label: 'Email', url: 'mailto:you@example.com' },
  ] satisfies SocialLink[],
  skills: ['TypeScript', 'Web 前端', 'Node.js'],
};
