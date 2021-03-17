export const IssueTypeEnum = {
  // @deprecate
  bug: 0,
  task: 1,
  feature: 2,
  requirement: 3,
  support: 4,
  epic: 5,
};

export const IssueStatusEnum = {
  // @deprecate
  open: 0,
  assigned: 1,
  in_progress: 2,
  on_hold: 3,
  under_review: 4,
  done: 5,
  released: 6,
};

const Enum = (object) => {
  /*
   * `this` is as good a reason `as any` to switch to TypeScript  :/
   * Might just try this instead: https://github.com/rauschma/enums
   */
  return new Proxy(
    Object.freeze(object),
    Object.freeze({
      get: function (target, lookup) {
        const lookupByName = isNaN(parseInt(lookup, 10));
        const lookupByValue = !lookupByName;
        if (lookupByName) {
          const value = target[lookup];
          return value;
        }
        if (lookupByValue) {
          const name = Object.fromEntries(
            Object.entries(target).map(([key, val]) => [val, key]),
          )[lookup];
          return name;
        }
      },
    }),
  );
};

export const _IssueTypeEnum = Enum({
  UNKNOWN: 0,
  BUG: 1,
  TASK: 2,
  FEATURE: 3,
  REQUIREMENT: 4,
  SUPPORT: 5,
  EPIC: 6,
});

export const _IssueStatusEnum = Enum({
  UNKNOWN: 0,
  OPEN: 1,
  ASSIGNED: 2,
  IN_PROGRESS: 3,
  ON_HOLD: 4,
  UNDER_REVIEW: 5,
  DONE: 6,
  RELEASED: 7,
});

export const _IssueResolutionEnum = Enum({
  UNKNOWN: 0,
  UNRESOLVED: 1,
  INVALID: 2,
  WONT_FIX: 3,
  OVERCOME_BY_EVENTS: 4,
  UNABLE_TO_REPLICATE: 5,
  DUPLICATE: 6,
  COMPLETE: 7,
});
