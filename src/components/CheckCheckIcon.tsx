import React from 'react';

interface PixelArtProps {
  iconId: string;
  size?: number;
}

/**
 * 체크체크박스 진화 단계별 18x18 레트로 도트 아이콘 컴포넌트
 * 각 아이콘은 18x18 그리드로 구성된 SVG입니다.
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

  // 아이콘 데이터 (18x18)
  // ' ' 는 투명, 나머지는 색상 키
  const icons: Record<string, { pixels: string[], colors: Record<string, string> }> = {
    egg: {
      pixels: [
        "                  ",
        "       hhhh       ",
        "     hhHHHHhh     ",
        "    hHHHHHHHHh    ",
        "   hHHHHHHHHHHh   ",
        "  hHHHHHHHHHHHHh  ",
        "  hHHHHHHHHHHHHh  ",
        " hHHHHHHHHHHHHHHh ",
        " hHHHHHHHHHHHHHHh ",
        " hHHHHHHHHHHHHHHh ",
        " hHHHHHHHHHHHHHHh ",
        "  hHHHHHHHHHHHHh  ",
        "  hHHHHHHHHHHHHh  ",
        "   hHHHHHHHHHHh   ",
        "    hHHHHHHHHh    ",
        "     hhHHHHhh     ",
        "       hhhh       ",
        "                  "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1' }
    },
    chick_in_shell: {
      pixels: [
        "                  ",
        "       hhhh       ",
        "     hhHHHHhh     ",
        "    hHHyyyyHHh    ",
        "   hHHyyyyyyHHh   ",
        "  hHHyyEyyEyyHHh  ",
        "  hHHyyyyyyyBHHh  ",
        " hHHhhhhhhhhhhHHh ",
        " hHHhHHHHHHHHhHHh ",
        " hHHhHHHHHHHHhHHh ",
        " hHHhHHHHHHHHhHHh ",
        "  hHHhHHHHHHhHHh  ",
        "  hHHhHHHHHHhHHh  ",
        "   hHHhHHHHhHHh   ",
        "    hHHhhhhHHh    ",
        "     hhHHHHhh     ",
        "       hhhh       ",
        "                  "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1', y: '#FDE047', E: '#000000', B: '#F97316' }
    },
    chick_hat_shell: {
      pixels: [
        "                  ",
        "       hhhh       ",
        "     hhHHHHhh     ",
        "    hHHHHHHHHh    ",
        "     hhhhhhhh     ",
        "     yyyyyyyy     ",
        "    yyEyyyyEyy    ",
        "    yyyyyyyyyy    ",
        "    yyyyBBByyy    ",
        "    yyyyyyyyyy    ",
        "     yyyyyyyy     ",
        "     yyyyyyyy     ",
        "    yyyyyyyyyy    ",
        "     yy    yy     ",
        "     yy    yy     ",
        "    yyy    yyy    ",
        "                  ",
        "                  "
      ],
      colors: { H: '#F8FAFC', h: '#CBD5E1', y: '#FDE047', E: '#000000', B: '#F97316' }
    },
    chick: {
      pixels: [
        "                  ",
        "                  ",
        "       yyyy       ",
        "     yyYYYYyy     ",
        "    yYYYYYYYYy    ",
        "   yYYEyyyyEYYy   ",
        "   yYYYYYYYYYYy   ",
        "   yYYYYBBBYYYy   ",
        "   yYYYYYYYYYYy   ",
        "    yYYYYYYYYy    ",
        "    yyyyyyyyyy    ",
        "   yyyyyyyyyyyy   ",
        "  yyyyyyyyyyyyyy  ",
        "   yyyyyyyyyyyy   ",
        "     yy    yy     ",
        "     yy    yy     ",
        "    yyy    yyy    ",
        "                  "
      ],
      colors: { Y: '#FDE047', y: '#FACC15', E: '#000000', B: '#F97316' }
    },
    orange_chick: {
      pixels: [
        "                  ",
        "                  ",
        "       oooo       ",
        "     ooOOOOoo     ",
        "    oOOOOOOOOo    ",
        "   oOOEooooEOOo   ",
        "   oOOOOOOOOOOo   ",
        "   oOOOOBBBOOOo   ",
        "   oOOOOOOOOOOo   ",
        "    oOOOOOOOOo    ",
        "    oooooooooo    ",
        "   oooooooooooo   ",
        "  oooooooooooooo  ",
        "   oooooooooooo   ",
        "     oo    oo     ",
        "     oo    oo     ",
        "    ooo    ooo    ",
        "                  "
      ],
      colors: { O: '#FB923C', o: '#F97316', E: '#000000', B: '#F97316' }
    },
    orange_chick_comb: {
      pixels: [
        "       rrr        ",
        "      rRRRr       ",
        "       oooo       ",
        "     ooOOOOoo     ",
        "    oOOOOOOOOo    ",
        "   oOOEooooEOOo   ",
        "   oOOOOOOOOOOo   ",
        "   oOOOOBBBOOOo   ",
        "   oOOOOOOOOOOo   ",
        "    oOOOOOOOOo    ",
        "    oooooooooo    ",
        "   oooooooooooo   ",
        "  oooooooooooooo  ",
        "   oooooooooooo   ",
        "     oo    oo     ",
        "     oo    oo     ",
        "    ooo    ooo    ",
        "                  "
      ],
      colors: { O: '#FB923C', o: '#F97316', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626' }
    },
    white_chicken: {
      pixels: [
        "       rrr        ",
        "      rRRRr       ",
        "       ssss       ",
        "     ssWWWWss     ",
        "    sWWWWWWWWs    ",
        "   sWWEssssEWWs   ",
        "   sWWWWWWWWWWs   ",
        "   sWWWWBBWWWWs   ",
        "   sWWWWWWWWWWs   ",
        "    sWWWWWWWWs    ",
        "    ssssssssss    ",
        "   ssssssssssss   ",
        "  ssssssssssssss  ",
        "   ssssssssssss   ",
        "     ss    ss     ",
        "     BB    BB     ",
        "    BBB    BBB    ",
        "                  "
      ],
      colors: { W: '#FFFFFF', s: '#E2E8F0', E: '#000000', B: '#F97316', R: '#EF4444', r: '#DC2626' }
    },
    red_chicken: {
      pixels: [
        "       yyy        ",
        "      yYYYYy      ",
        "       rrrr       ",
        "     rrRRRRrr     ",
        "    rRRRRRRRRr    ",
        "   rRRErrrrERRr   ",
        "   rRRRRRRRRRRr   ",
        "   rRRRRBBBRRRr   ",
        "   rRRRRRRRRRRr   ",
        "    rRRRRRRRRr    ",
        "    rrrrrrrrrr    ",
        "   rrrrrrrrrrrr   ",
        "  rrrrrrrrrrrrrr  ",
        "   rrrrrrrrrrrr   ",
        "     rr    rr     ",
        "     YY    YY     ",
        "    YYY    YYY    ",
        "                  "
      ],
      colors: { R: '#EF4444', r: '#DC2626', E: '#000000', B: '#FDE047', Y: '#FDE047' }
    },
    phoenix: {
      pixels: [
        "    G        G    ",
        "     G  rrr  G    ",
        "      GrRRRg      ",
        "     rrRRRRRrr    ",
        "    rRRRRRRRRRr   ",
        "   rRRErrrrERRr   ",
        "   rRRRRRRRRRRr   ",
        "   rRRRRGGGRRRr   ",
        "   rRRRRRRRRRRr   ",
        "    rRRRRRRRRr    ",
        "    rrrrrrrrrr    ",
        "   rrrrrrrrrrrr   ",
        "  rrrrrrrrrrrrrr  ",
        "   rrrrrrrrrrrr   ",
        "     rr    rr     ",
        "    GG      GG    ",
        "   GGG      GGG   ",
        "                  "
      ],
      colors: { R: '#EF4444', r: '#DC2626', E: '#000000', G: '#FDE047', g: '#FACC15' }
    }
  };

  const currentIcon = icons[iconId] || icons.egg;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{ imageRendering: 'pixelated' }}
    >
      {renderPixels(currentIcon.pixels, currentIcon.colors)}
    </svg>
  );
};
