import { DATE_TIME_FORMAT } from '@core/services/api/api.constants';
import * as moment from 'moment';

export const chunk = <T>(arr: T[], chunkSize: number): T[][] => {

  const results = [];

  while (arr.length) {
    results.push(arr.splice(0, chunkSize));
  }

  return results;
};

export const sortByProperty = <T>(arr: T[], key: string, direction: string): T[] => {
  if (key.includes('Short')) {
    return arr.sort(sortArrayByMoment(key, direction));
  } else {
    return arr.sort(sortArrayBy(key, direction));
  }
};

export const allSame = <T> (arr: T[]): any => {
  const first = arr[0];
  const result = arr.every(element => element === first);

  return  (result) ? first : 'VARIOS';
};

export const sortArrayByMoment = (column: string, direction?: string) => {
  if (!direction) {
    direction = 'asc';
  }
  return (a: any, b: any) => {
    const date1 = moment(a[column], DATE_TIME_FORMAT);
    const date2 = moment(b[column], DATE_TIME_FORMAT);
    return direction === 'asc'
      ?
        moment(date1).diff(date2)
      :
        moment(date2).diff(date1);
  };
};

export const sortArrayBy = (column: string, direction?: string) => {
  let sortOrder = 1;

  if (!direction) {
    direction = 'asc';
  }

  if (direction === 'asc') {
    sortOrder = -1;
  }

  return  (a: any, b: any) => {
    // Si la columna no es numérica se ordena como String
    if (a[column] !== '' && isNaN(Number(a[column]))) {
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
    // Si la columna es numérica se ordena como numérico
    } else {
      return sortOrder === -1 ? a[column] - b[column] : b[column] - a[column];
    }

  };
};
