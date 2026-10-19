export type Gender = "mulher" | "homem";

export type Prompt = { q: string; a: string };

export type Person = {
  id: string;
  name: string;
  age: number;
  city: string;
  job: string;
  bio: string;
  gender: Gender;
  interests: string[];
  photos: string[];
  distanceKm: number;
  likesYou: boolean;
  online: boolean;
  prompts: Prompt[];
  opener: string;
  replies: string[];
  verified?: boolean;
  sponsored?: {
    brand: string;
    poll: string;
    options: string[];
    coupon: string;
  };
};

export type Me = {
  id: "me";
  name: string;
  age: number;
  city: string;
  job: string;
  bio: string;
  gender: Gender;
  interests: string[];
  photos: string[];
};

export type Prefs = {
  show: "todos" | Gender;
  ageMin: number;
  ageMax: number;
  maxKm: number;
  verifiedOnly: boolean;
  lat?: number;
  lng?: number;
};

export type Match = {
  id: string;
  at: number;
  super: boolean;
};

export type Message = {
  id: string;
  matchId: string;
  from: "me" | "them";
  text: string;
  at: number;
  media?: string;
};

export type Comment = {
  id: string;
  author: string;
  text: string;
  at: number;
};

export type Reel = {
  id: string;
  authorId: string;
  caption: string;
  media: string;
  poster: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  at: number;
  mine?: boolean;
};

export type HistoryItem = {
  id: string;
  action: "like" | "pass" | "super";
  matched: boolean;
};

export type ReelExtra = {
  liked?: boolean;
  comments?: Comment[];
};
