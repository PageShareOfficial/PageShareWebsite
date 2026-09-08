export type LandingStoryStep =
  | {
      id: string;
      step: number;
      title: string;
      kind: 'dual-persona';
    }
  | {
      id: string;
      step: number;
      title: string;

      kind: 'image';
      imageSrc: string;
      imageAlt: string;
    };

export const LANDING_STORY_STEPS: LandingStoryStep[] = [
  {
    id: 'personas',
    step: 1,
    kind: 'dual-persona',
    title: 'Built for Analysts & Investors',
  },
  {
    id: 'join',
    step: 2,
    kind: 'image',
    imageSrc: '/story/image-01.png',
    imageAlt: 'Analyst joining PageShare with profile and track record',
    title: 'Join and build your profile',
  },
  {
    id: 'lock',
    step: 3,
    kind: 'image',
    imageSrc: '/story/image-02.png',
    imageAlt: 'New prediction form becoming a locked permanent record',
    title: 'Record a structured prediction',
  },
  {
    id: 'verify',
    step: 4,
    kind: 'image',
    imageSrc: '/story/image-03.png',
    imageAlt: 'Verification engine comparing prediction to actual market outcome',
    title: 'We verify against the market',
  },
  {
    id: 'leaderboard',
    step: 5,
    kind: 'image',
    imageSrc: '/story/image-04.png',
    imageAlt: 'Analyst rankings leaderboard with verified performance metrics',
    title: 'Rankings based on verified results',
  },
  {
    id: 'analytics',
    step: 6,
    kind: 'image',
    imageSrc: '/story/image-05.png',
    imageAlt: 'Investor reviewing analyst analytics dashboard',
    title: 'Analytics at your fingertips',
  },
  {
    id: 'connect',
    step: 7,
    kind: 'image',
    imageSrc: '/story/image-06.png',
    imageAlt: 'Analyst and investor reviewing performance data together',
    title: 'Collaborate and make Breakthrough decisions',
  },
];
