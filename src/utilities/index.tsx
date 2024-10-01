export function formatIsoDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
}

export function insertKeyAtPos(key: string, value: any, obj: { [k: string]: any }, pos: number) {
  return Object.keys(obj).reduce((ac: { [k: string]: any }, a, i) => {
    if (i === pos) ac[key] = value;
    ac[a] = obj[a];
    return ac;
  }, {});
}
export function insertKeyAfter(key: string, value: any, obj: { [k: string]: any }, afterKey: string) {
  return Object.keys(obj).reduce((ac: { [k: string]: any }, a, i) => {
    ac[a] = obj[a];
    if (a === afterKey) ac[key] = value;
    return ac;
  }, {});
}
export function insertKeyBefore(key: string, value: any, obj: { [k: string]: any }, beforeKey: string) {
  return Object.keys(obj).reduce((ac: { [k: string]: any }, a, i) => {
    if (a === beforeKey) ac[key] = value;
    ac[a] = obj[a];
    return ac;
  }, {});
}

interface IInsertKeyMulti {
  obj: { [k: string]: any };
  insert: {
    key: string;
    value: any;
    afterKey: string;
  }[];
}
export function insertKeyAfterMulti({ obj, insert }: IInsertKeyMulti) {
  return Object.keys(obj).reduce((ac: { [k: string]: any }, a, i) => {
    ac[a] = obj[a];
    for (let r of insert) {
      if (a === r.afterKey) ac[r.key] = r.value;
    }
    return ac;
  }, {});
}

export function humanTime_ms(milliseconds: number) {
  var hTime = "na";
  var temp = [];
  const negative = milliseconds < 0;
  if (negative) milliseconds = -milliseconds;
  //human readable time. Input milliseconds
  if (milliseconds >= 1000 * 60 * 60 * 24 * 7) {
    // if more than 7 days
    hTime = `${Math.trunc(milliseconds / (1000 * 60 * 60 * 24))}d`;
  } else if (milliseconds >= 1000 * 60 * 60 * 24) {
    // if more than 24 hours
    hTime = `${Math.trunc(milliseconds / (1000 * 60 * 60 * 24))}d, ${Math.round(
      (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )}h`;
  } else if (milliseconds >= 1000 * 60 * 60) {
    // if more than 1 hour
    hTime = `${Math.trunc(milliseconds / (1000 * 60 * 60))}h, ${Math.round(
      (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
    )}m`;
  } else if (milliseconds >= 1000 * 60) {
    //if more than 1 minute
    hTime = `${Math.trunc(milliseconds / (1000 * 60))}m, ${Math.round((milliseconds % (1000 * 60)) / 1000)}s`;
  } else if (milliseconds >= 1000) {
    //if more than 1 second
    hTime = `${Math.trunc(milliseconds / 1000)}s, ${Math.round(milliseconds % 1000)}ms`;
  } else {
    hTime = milliseconds + "ms";
  }
  if (negative) hTime += " ago";
  return hTime;
}
