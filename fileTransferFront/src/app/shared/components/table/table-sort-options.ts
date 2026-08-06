import { SortablejsOptions } from 'ngx-sortablejs';
import { ROW_HOVER_CLASS } from '@shared/components/table/row/row.component';

const TABLE_SORTING_CLASS = 'table--sorting';
const ROW_SORTED_CLASS = 'row--sorted';
const ROW_SORTED_CLASS_DURATION = 1000;

const deleteRowHoverClass = (e: CustomEvent): void => {
  const container = e.target as HTMLElement;
  const rowHover = container.querySelector(`.${ROW_HOVER_CLASS}`);
  if (rowHover) {
    rowHover.classList.remove(ROW_HOVER_CLASS);
  }
};

const getTableElement = (e: CustomEvent): HTMLElement => {
  return ((e.target as HTMLElement).parentElement as HTMLElement);
};

const getRowElement = (e: CustomEvent): HTMLElement => {
  return ((e as any).item as HTMLElement);
};

export const buildTableSortOptions = (onUpdate: () => void): SortablejsOptions => {
  return {
    disabled: true,
    scroll: true,
    onStart: (e: CustomEvent) => {
      getTableElement(e).classList.add(TABLE_SORTING_CLASS);
      deleteRowHoverClass(e);
    },
    onEnd: (e: CustomEvent) => {
      getTableElement(e).classList.remove(TABLE_SORTING_CLASS);
      deleteRowHoverClass(e);
      getRowElement(e).classList.add(ROW_SORTED_CLASS);
      setTimeout(() => getRowElement(e).classList.remove(ROW_SORTED_CLASS), ROW_SORTED_CLASS_DURATION);
    },
    onMove: (e: CustomEvent): boolean => {
      deleteRowHoverClass(e);
      return true;
    },
    onUpdate: () => {
      onUpdate();
    }
  };
};
