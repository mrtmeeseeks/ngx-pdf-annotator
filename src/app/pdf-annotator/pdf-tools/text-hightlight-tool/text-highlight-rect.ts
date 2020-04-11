export const removeIntercetingRects = (rects: DOMRect[]) => {

    let newRects = JSON.parse(JSON.stringify(rects));
    const findDuplicates = () => {
      let results = [];
      for (let i = 0; i < newRects.length - 1; i++) {
        const first: DOMRect = newRects[i + 1];
        const second: DOMRect = newRects[i];

        let ceilY = 0;
        let floorY = 0;

        if (first.y > second.y) {
          floorY = Math.floor(first.y);
          ceilY = Math.ceil(second.y);
        } else {
          floorY = Math.floor(second.y);
          ceilY = Math.ceil(first.y);
        }

        if (ceilY === floorY && Math.round(first.x) === Math.round(second.x)) {
          if (first.width > second.width) {
            results.push(first);
          } else {
            results.push(second);
          }
        }
      }
      return results;
    };

    const res = findDuplicates();

    newRects = newRects.filter((rect) => {
      return !res.some((r) => {
        return rect === r;
      });
    });

    return newRects;
}


