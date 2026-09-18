// 自动生成，请勿手改：由 build-captions.py 依据 public/audio/tts/*.srt 生成。
//
// 卡点表：每个动画元素该在第几帧出场，由「那个词被念到的时刻」决定，
// 不是拍脑袋定的帧号（第一版就是拍脑袋，大字比旁白早 1.5–7.7s，观众读作对不上）。
// abs = 全片绝对帧号；rel/end = 相对所属分镜起点的帧号。

export type Anchor = { abs: number; rel: number; end: number };

export const SHOT_START: Record<string, number> = {
  "tts-open": 0,
  "tts-r1": 511,
  "tts-r2": 1130,
  "tts-r3": 1754,
  "tts-r4": 2176,
  "tts-outro": 2594
};

export const A: Record<string, Anchor> = {
  "open.hook": {
    "abs": 3,
    "rel": 3,
    "end": 42
  },
  "open.stem": {
    "abs": 55,
    "rel": 55,
    "end": 88
  },
  "open.topic": {
    "abs": 95,
    "rel": 95,
    "end": 118
  },
  "open.y2027": {
    "abs": 199,
    "rel": 199,
    "end": 230
  },
  "open.month": {
    "abs": 242,
    "rel": 242,
    "end": 262
  },
  "open.ninety": {
    "abs": 303,
    "rel": 303,
    "end": 324
  },
  "open.ready": {
    "abs": 477,
    "rel": 477,
    "end": 497
  },
  "r1.first": {
    "abs": 514,
    "rel": 3,
    "end": 28
  },
  "r1.full": {
    "abs": 574,
    "rel": 63,
    "end": 107
  },
  "r1.central": {
    "abs": 630,
    "rel": 119,
    "end": 139
  },
  "r1.units": {
    "abs": 732,
    "rel": 221,
    "end": 242
  },
  "r1.rail": {
    "abs": 799,
    "rel": 288,
    "end": 307
  },
  "r1.unified": {
    "abs": 915,
    "rel": 404,
    "end": 462
  },
  "r1.oct": {
    "abs": 980,
    "rel": 469,
    "end": 505
  },
  "r1.nov": {
    "abs": 1021,
    "rel": 510,
    "end": 540
  },
  "r1.fresh": {
    "abs": 1057,
    "rel": 546,
    "end": 605
  },
  "r2.second": {
    "abs": 1133,
    "rel": 3,
    "end": 27
  },
  "r2.self": {
    "abs": 1198,
    "rel": 68,
    "end": 98
  },
  "r2.levels": {
    "abs": 1293,
    "rel": 163,
    "end": 202
  },
  "r2.near": {
    "abs": 1407,
    "rel": 277,
    "end": 293
  },
  "r2.joint": {
    "abs": 1491,
    "rel": 361,
    "end": 378
  },
  "r2.march": {
    "abs": 1532,
    "rel": 402,
    "end": 452
  },
  "r2.friendly": {
    "abs": 1642,
    "rel": 512,
    "end": 572
  },
  "r2.anyone": {
    "abs": 1709,
    "rel": 579,
    "end": 609
  },
  "r3.who": {
    "abs": 1761,
    "rel": 7,
    "end": 46
  },
  "r3.both": {
    "abs": 1844,
    "rel": 90,
    "end": 108
  },
  "r3.nov": {
    "abs": 1876,
    "rel": 122,
    "end": 159
  },
  "r3.march": {
    "abs": 1919,
    "rel": 165,
    "end": 220
  },
  "r3.stagger": {
    "abs": 1981,
    "rel": 227,
    "end": 259
  },
  "r3.double": {
    "abs": 2131,
    "rel": 377,
    "end": 407
  },
  "r4.who": {
    "abs": 2179,
    "rel": 3,
    "end": 29
  },
  "r4.prov": {
    "abs": 2219,
    "rel": 43,
    "end": 78
  },
  "r4.limit": {
    "abs": 2268,
    "rel": 92,
    "end": 140
  },
  "r4.fierce": {
    "abs": 2344,
    "rel": 168,
    "end": 192
  },
  "r4.near": {
    "abs": 2382,
    "rel": 206,
    "end": 256
  },
  "r4.hukou": {
    "abs": 2440,
    "rel": 264,
    "end": 318
  },
  "r4.odds": {
    "abs": 2537,
    "rel": 361,
    "end": 404
  },
  "outro.mnemonic": {
    "abs": 2597,
    "rel": 3,
    "end": 35
  },
  "outro.central": {
    "abs": 2637,
    "rel": 43,
    "end": 71
  },
  "outro.local": {
    "abs": 2671,
    "rel": 77,
    "end": 104
  },
  "outro.fresh": {
    "abs": 2706,
    "rel": 112,
    "end": 138
  },
  "outro.past": {
    "abs": 2737,
    "rel": 143,
    "end": 172
  },
  "outro.signup": {
    "abs": 2780,
    "rel": 186,
    "end": 251
  },
  "outro.cta": {
    "abs": 2851,
    "rel": 257,
    "end": 285
  }
};
