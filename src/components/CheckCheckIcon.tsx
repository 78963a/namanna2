import React from 'react';

interface PixelArtProps {
  iconId: string;
  size?: number;
}

/**
 * 체크체크박스 진화 단계별 20x20 레트로 도트 아이콘 컴포넌트
 * 각 아이콘은 20x20 그리드로 구성된 SVG입니다.
 */
export const CheckCheckIcon: React.FC<PixelArtProps> = ({ iconId, size = 32 }) => {
  // 도트 그리기 유틸리티
  const renderPixels = (pixels: string[], colors: Record<string, string>) => {
    return pixels.map((row, y) => {
      return row.split('').map((char, x) => {
        if (char === ' ') return null;
        return (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill={colors[char] || '#000'}
          />
        );
      });
    });
  };

  // 아이콘 데이터 (20x20)
  // ' ' 는 투명, 나머지는 색상 키
  const icons: Record<string, { pixels: string[], colors: Record<string, string> }> = {
    egg: {
      pixels: [
        "                   ",
        "        hhhh       ",
        "      hhHHHHhh     ",
        "     hHHHHHHHHh    ",
        "    hHHHHHHHHHHh   ",
        "   hHHHHHHHHHHHHh  ",
        "   hHHHHHHHHHHHHh  ",
        "  hHHHHHHHHHHHHHHh ",
        "  hHHHHHHHHHHHHHHh ",
        "  hHHHHHHHHHHHHHHh ",
        "  hHHHHHHHHHHHHHHh ",
        "   hHHHHHHHHHHHHh  ",
        "   hHHHHHHHHHHHHh  ",
        "    hHHHHHHHHHHh   ",
        "     hHHHHHHHHh    ",
        "      hhHHHHhh     ",
        "        hhhh       ",
        "                   ",
        "                   ",
        "                   "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1' }
    },
     broken_egg: {
 pixels: [
        "                   ",
        "        hhhh       ",
        "      hhHHHHhh     ",
        "     hHHHHHHHHh    ",
        "    hHhHHHHHHHHh   ",
        "   hHHhHHHHHHHHHh  ",
        "   hHHHhhHHHHHHHh  ",
        "  hHHHHhHHhhHHHHHh ",
        "  hHHHhHHHHHhHHHHh ",
        "  hHHhHHHHHHHHHHHh ",
        "  hHHHhHHHHHHHHHHh ",
        "   hHHHHHHHHHHHHh  ",
        "   hHHHHHHHHHHHHh  ",
        "    hHHHHHHHHHHh   ",
        "     hHHHHHHHHh    ",
        "      hhHHHHhh     ",
        "        hhhh       ",
        "                   ",
        "                   ",
        "                   "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1' }
    },

    chick_in_shell: {
      pixels: [
        "                   ",
        "                   ",
        "        hhhhh      ",
        "      hhHHHHHh     ",
        "     hHHHHHHHHhh   ",
        "    hHHHHHHHHHHHh  ",
        "   hhhhhhhhhhhhh   ",
        "     hyyyyyyyyh    ",
        "    hyyyEyyEyyyh   ",
        "    hyyyyByyyyyh   ",
        "  hhhhyhhhhyhhhhhh ",
        "  hHHHhHHHHhHHhHHh ",
        "  hHHHHHHHHHHHhHHh ",
        "  hHHHHHHHHHHHhHHh ",
        "   hHHHHHHHHHhHHh  ",
        "   hHHHHHHHHHhHHh  ",
        "    hHHHHHHHhHHh   ",
        "     hHHHHHHHHh    ",
        "      hhHHHHhh     ",
        "        hhhh       "
  ],
  colors: { H: '#F8FAFC', h: '#CBD5E1', y: '#FDE047', E: '#000000', B: '#F97316' }
},    


 chick_hat_shell: {
      pixels: [
        "                   ",
        "        hhhh       ",
        "      hhHHHHhh     ",
        "     hHHHHHHHHh    ",
        "    hHHHHHHHHHHh    ",
        "    hhhhhhhhhhhh    ",
        "     yyEyyyyEyy    ",
        "     yyyyyyyyyy    ",
        "     yyyyBBByyy    ",
        "     yyyyyyyyyy    ",
        "      yyyyyyyy     ",
        "     yyyyyyyyyy    ",
        "    yyyyyyyyyyyy   ",
        "   yyyyyyyyyyyyyy  ",
        "    yyyyyyyyyyyy   ",
        "      yyyyyyyy     ",
        "     yyy    yyy    ",
        "                   ",
        "                   ",
        "                   "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1', y: '#FDE047', E: '#000000', B: '#F97316' }
    },
    yellow_chick: {
      pixels: [
        "                   ",
        "        YYYY       ",
        "      YYYYYYYY     ",
        "     YYYYYYYYYY    ",
        "    YYYEYYYYEYYY   ",
        "    YYYYYYYYYYYY   ",
        "    YYYYYBBBYYYY   ",
        "    YYYYYYYYYYYY   ",
        "     YYYYYYYYYY    ",
        "     YYYYYYYYYY    ",
        "    YYYYYYYYYYYY   ",
        "   YYYYYYYYYYYYYY  ",
        "   YYYYYYYYYYYYYYY ",
        "     YYYYYYYYYYY   ",
        "      YYYYYYYYY    ",
        "      YYYYYYYYY    ",
        "       yy    yy    ",
        "      yyy    yyy   ",
        "                   ",
        "                   "
      ],
      colors: { Y: '#FDE047', y: '#FACC15', E: '#000000', B: '#F97316' }
    },
    orange_chick: {
      pixels: [
        "                   ",
        "        YYYY       ",
        "      YYYYYYYY     ",
        "     YYYYYYYYYY    ",
        "    YYYEYYYYEYYY   ",
        "    YYYYYYYYYYYY   ",
        "    YYYYYBBBYYYY   ",
        "    YYYYYYYYYYYY   ",
        "     YYYYYYYYYY    ",
        "     YYYYYYYYYY    ",
        "    YYYYYYYYYYYY   ",
        "   YYYYYYYYYYYYYY  ",
        "   YYYYYYYYYYYYYYY ",
        "     YYYYYYYYYYY   ",
        "      YYYYYYYYY    ",
        "      YYYYYYYYY    ",
        "       yy    yy    ",
        "      yyy    yyy   ",
        "                   ",
        "                   "
      ],
      colors: { Y: '#FB923C', y: '#F97316', E: '#000000', B: '#F97316' }
    },


  orange_chick_comb: {
      pixels: [
        "       ry rrRr     ",
        "        rRRRr      ",
        "        YyyY       ",
        "      YYYYYYYY     ",
        "     YYYYYYYYYY    ",
        "    YYYEYYYYEYYY   ",
        "    YYYYYYYYYYYY   ",
        "    YYYYYBBBYYYY   ",
        "    YYYYYYYYYYYY   ",
        "     YYYYYYYYYY    ",
        "     YYYYYYYYYY    ",
        "    YYYYYYYYYYYY   ",
        "   YYYYYYYYYYYYYY  ",
        "   YYYYYYYYYYYYYYY ",
        "     YYYYYYYYYYY   ",
        "      YYYYYYYYY    ",
        "      YYYYYYYYY    ",
        "       yy    yy    ",
        "      yyy    yyy   ",
        "                   "
      ],
      colors: { Y: '#FB923C', y: '#F97316', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626' }
    },

  white_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWs    ",
        "    sWWWWWWWWWWs   ",
        "   sWWWWWWWWWWWWs  ",
        "   ssWWWWWWWWWWss  ",
        "    sWWWWWWWWWWs   ",
        "      ssssssss     ",
        "      BB    BB     ",
        "     BBB    BBB    ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FFFFFF', s: '#E2E8F0', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626' }
    },

     ribbon_white_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWxxWxxWWWs  ",
        "    sWWxxWxWxxWs   ",
        "   sWWWWWWWWWWWWs  ",
        "   ssWWWWWWWWWWss  ",
        "    sWWWWWWWWWWs   ",
        "      ssssssss     ",
        "      BB    BB     ",
        "     BBB    BBB    ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FFFFFF', s: '#E2E8F0', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626', x: '#ff33ff'}
    },

/**
 * 꽃 흰 닭 여기에 그리기
 */


   flower_white_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWq    ",
        "    sWWWWWWWWqqq   ",
        "   sWWWWWWWWqqaqq  ",
        "   ssWWWWWWWWqqqs  ",
        "    sWWWWWWWWWqg   ",
        "      ssssssss  g  ",
        "      BB    BBg g  ",
        "     BBB    BBBggg ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FFFFFF', s: '#E2E8F0', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626', q:'#ff66ff', a:'#ff99ff', g:'#336600'}
    },

  /**
   * 노란닭 여기에 그리기
   */


  yellow_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWs    ",
        "    sWWWWWWWWWWs   ",
        "   sWWWWWWWWWWWWs  ",
        "   ssWWWWWWWWWWss  ",
        "    sWWWWWWWWWWs   ",
        "      ssssssss     ",
        "      BB    BB     ",
        "     BBB    BBB    ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FFFF99', s: '#ffcc33', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626' }
    },


/**
 * 꽃 노란 닭 여기에 그리기
 */


   flower_yellow_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWq    ",
        "    sWWWWWWWWqqq   ",
        "   sWWWWWWWWqqaqq  ",
        "   ssWWWWWWWWqqqs  ",
        "    sWWWWWWWWWqg   ",
        "      ssssssss  g  ",
        "      BB    BBg g  ",
        "     BBB    BBBggg ",
        "                   ",
        "                   "
      ],
      colors: {W: '#FFFF99', s: '#ffcc33', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626', q:'#ff66ff', a:'#ff99ff', g:'#336600'}
    },
    

    red_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWs    ",
        "    sWWWWWWWWWWs   ",
        "   sWWWWWWWWWWWWs  ",
        "   ssWWWWWWWWWWss  ",
        "    sWWWWWWWWWWs   ",
        "      ssssssss     ",
        "      BB    BB     ",
        "     BBB    BBB    ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FF6600', s: '#ff3300', E: '#000000', B: '#330000', R: '#EF4444', r: '#DC2626' }
    },


    /**
 * 꽃 빨간 닭 여기에 그리기
 */

    flower_red_chicken: {
      pixels: [
        "        rrrr       ",
        "       rRRRRr      ",
        "        sRRRs      ",
        "      ssWWWWss     ",
        "     sWWWWWWWWs    ",
        "    sWWEWWWWEWWs   ",
        "    sWWWWWWWWWWs   ",
        "    sWWWWBBWWWWs   ",
        "    sWWWWWWWWWWs   ",
        "     sWWWWWWWWs    ",
        "     sWWWWWWWWq    ",
        "    sWWWWWWWWqqq   ",
        "   sWWWWWWWWqqaqq  ",
        "   ssWWWWWWWWqqqs  ",
        "    sWWWWWWWWWqg   ",
        "      ssssssss  g  ",
        "      BB    BBg g  ",
        "     BBB    BBBggg ",
        "                   ",
        "                   "
      ],
      colors: { W: '#FF6600', s: '#ff3300',  E: '#000000',  B: '#330000', R: '#EF4444', r: '#DC2626', q:'#ff66ff', a:'#ff99ff', g:'#336600'}
    },
    
    phoenix: {
      pixels: [
        "     G        G    ",
        "      G  rrr  G    ",
        "       GrRRRg      ",
        "      rrRRRRRrr    ",
        "     rRRRRRRRRRr   ",
        "    rRRErrrrERRr   ",
        "    rRRRRRRRRRRr   ",
        "    rRRRRGGGRRRr   ",
        "    rRRRRRRRRRRr   ",
        "     rRRRRRRRRr    ",
        "     rrrrrrrrrr    ",
        "    rrrrrrrrrrrr   ",
        "   rrrrrrrrrrrrrr  ",
        "    rrrrrrrrrrrr   ",
        "      rr    rr     ",
        "     GG      GG    ",
        "    GGG      GGG   ",
        "                   ",
        "                   ",
        "                   "
      ],
      colors: { R: '#EF4444', r: '#DC2626', E: '#000000', G: '#FDE047', g: '#FACC15' }
    },

    
    crown_phoenix: {
      pixels: [
        "     G        G    ",
        "      G  rrr  G    ",
        "       GrRRRg      ",
        "      rrRRRRRrr    ",
        "     rRRRRRRRRRr   ",
        "    rRRErrrrERRr   ",
        "    rRRRRRRRRRRr   ",
        "    rRRRRGGGRRRr   ",
        "    rRRRRRRRRRRr   ",
        "     rRRRRRRRRr    ",
        "     rrrrrrrrrr    ",
        "    rrrrrrrrrrrr   ",
        "   rrrrrrrrrrrrrr  ",
        "    rrrrrrrrrrrr   ",
        "      rr    rr     ",
        "     GG      GG    ",
        "    GGG      GGG   ",
        "                   ",
        "                   ",
        "                   "
      ],
      colors: { R: '#EF4444', r: '#DC2626', E: '#000000', G: '#FDE047', g: '#FACC15' }
    }
  };

  const currentIcon = icons[iconId] || icons.egg;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ imageRendering: 'pixelated' }}
    >
      {renderPixels(currentIcon.pixels, currentIcon.colors)}
    </svg>
  );
};
