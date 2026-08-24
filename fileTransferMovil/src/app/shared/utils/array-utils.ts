export const sortArrayBy = (column: string, direction?: string) => {
  let sortOrder = 1;

  if (!direction) {
    direction = 'asc';
  }

  if (direction === 'asc') {
    sortOrder = -1;
  }

  return  (a: any, b: any) => {
    // equal items sort equally
    if (a[column] === b[column]) {
      return 0;
    } else if (a[column] === null) {
      // nulls sort after anything else and put in final
      return 1;
    } else if (b[column] === null) {
      return -1;
    } else if (sortOrder === -1) {
      // otherwise, if we're ascending, lowest sorts first
        return a[column] < b[column] ? -1 : 1;
    } else {
      // if descending, highest sorts first
        return a[column] < b[column] ? 1 : -1;
    }
  };
};
