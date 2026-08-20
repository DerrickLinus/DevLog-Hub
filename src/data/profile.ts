export interface SocialLink {
  label: string;
  url: string;
  /** 以文本原样展示（Email/微信号），不作为链接 */
  plain?: boolean;
}

export const profile = {
  name: 'Linhui Deng',
  siteName: 'DevLog Hub',
  bio: '研二在读 | 通信专业 | 大模型 Agent 研发实习中',
  avatar: '/avatar.jpg', // 头像图片路径，例如 /avatar.png，留空则显示首字母占位
  social: [
    { label: 'GitHub', url: 'https://github.com/DerrickLinus' },
    { label: 'Instagram', url: 'derricklinush', plain: true },
    { label: 'Email', url: 'doggyd1124@gmail.com', plain: true },
    { label: 'WeChat', url: 'derricklinus', plain: true },
  ] satisfies SocialLink[],
  skills: ['TypeScript', 'Web 前端', 'Node.js'],
};
