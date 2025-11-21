// Ported from C# TestTimeClass.cs
export const calculateTestTime = (
  examinationProcedureId: number,
  draftId: number,
  diameter: number // in mm (integer in C#)
): number => {
  // Returns duration in minutes
  let times: number[] = [];

  if (examinationProcedureId === 1) {
    times = [5, 5, 7, 10, 14, 19, 24, 27, 29];
  } else if (examinationProcedureId === 2) {
    times = [4, 4, 6, 7, 11, 15, 19, 21, 22];
  } else if (examinationProcedureId === 3) {
    times = [3, 3, 4, 5, 6, 11, 14, 15, 16];
  } else if (examinationProcedureId === 4) {
    times = [1.5, 1.5, 2, 2.5, 4, 5, 7, 7, 8];
  } else {
    return 0; // Default or fallback
  }

  const list = [100, 200, 300, 400, 600, 800, 1000, 1100, 1200];

  if (diameter >= Math.max(...list)) {
    const time = times[times.length - 1];
    return draftId === 4 ? time / 2 : time;
  }

  // Binary search for interval
  let l = 0;
  let r = list.length - 1;

  // Implementation of C# binary search logic:
  // int l = 0, r = list.Count - 1;
  // while (r - l > 1) { int m = (l + r) / 2; if (list[m] > value) r = m; else l = m; }
  while (r - l > 1) {
    const m = Math.floor((l + r) / 2);
    if (list[m] > diameter) {
      r = m;
    } else {
      l = m;
    }
  }

  // Interpolation
  // double time = times[l];
  // time += (times[r] - times[l]) * (value - list[l]) / (list[r] - list[l]);
  let time = times[l];
  time += ((times[r] - times[l]) * (diameter - list[l])) / (list[r] - list[l]);

  return draftId === 4 ? time / 2 : time;
};
