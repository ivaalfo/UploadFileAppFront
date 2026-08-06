import { Injectable, Inject } from '@angular/core';
import { LOCAL_STORAGE } from './storage.providers';
import { PageFilter, Pages } from '@core/services/storage/page.filters';
import { LockEntities } from '@data/shared/locks';

const FILTERS_PAGE = 'FT_FILTERS_PAGE_';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public constructor(
    @Inject(LOCAL_STORAGE) private localStorage: Storage = window.localStorage,
  ) { }

  // FILTERS

  public clearFiltersLess(page?: string): void {
    const keys = Object.keys(Pages);
    if (page) {
      const i = keys.indexOf(page);

      if (i !== -1) {
        keys.splice(i, 1);
      }
    }

    keys.forEach(k => {
      this.localStorage.removeItem(FILTERS_PAGE + k);
    });
  }

  public getPreviousPagePendingsFilter(): string[] {
    let filteredPendings: string[] = [];
    const previousPageFilter = this.checkPreviousFilter();
    if (previousPageFilter !== undefined) {
      const pendingOrders = previousPageFilter.filters.pendingOrders.split(',');
      filteredPendings = pendingOrders.filter(Boolean);
    }
    return filteredPendings;
  }

  private checkPreviousFilter(): PageFilter | undefined {
    const keys = Object.keys(Pages);
    const previousPage = keys.find(page => this.getFilters(page) !== undefined);
    return previousPage ? this.getFilters(previousPage) : undefined;
  }

  public setLock(lockEntity: LockEntities, key?: string, selectedCMRtrack?: string): void {
    if(lockEntity === "VALIDADOR"){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey + lockCMR);
      if (!data) {
        this.localStorage.setItem(lockEntity + lockKey + lockCMR, 'true');
      }
    }
    else {
      const lockKey = key ? `?clave=${key}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey);
      if (!data) {
        this.localStorage.setItem(lockEntity + lockKey, 'true');
      }
    }
  }

  public isLock(lockEntity: LockEntities, key?: string, selectedCMRtrack?: string): boolean {
    if(lockEntity === "VALIDADOR"){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey + lockCMR);
      return (data) ? true : false;
    }
    else {
      const lockKey = key ? `?clave=${key}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey);
      return (data) ? true : false;
    }
  }

  public deleteAllLocalStorageItems(): void {
    //this.deleteLocalStorageItem(LockEntities.LOCK_TABLE_ARTICLE, '' + this.getLastTreatedArticle());
    //this.deleteLocalStorageItem(LockEntities.LOCK_TABLE_CONTAINER, '' + this.getLastTreatedContainer());
    //this.deleteLocalStorageItem(LockEntities.LOCK_TABLE_PEDIDO, '' + this.getLastTreatedOrder());    //NEXT ficha_pedido
  }

  public deleteLocalStorageItem(lockEntity: LockEntities, key?: string, selectedCMRtrack?: string): void {
    if(lockEntity === "VALIDADOR"){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey + lockCMR);
      if (data) {
        this.localStorage.removeItem(lockEntity + lockKey + lockCMR);
      }
    }
    else {
      const lockKey = key ? `?clave=${key}` : '';
      const data = this.localStorage.getItem(lockEntity + lockKey);
      if (data) {
        this.localStorage.removeItem(lockEntity + lockKey);
      }
    }
  }

  public setFilters(data: PageFilter): void {
    const serializedResponse = JSON.stringify(data);
    this.localStorage.setItem(FILTERS_PAGE + data.page.toUpperCase(), serializedResponse);
  }

  public getFilters(page: string): PageFilter | undefined {
    const data = this.localStorage.getItem(FILTERS_PAGE + page.toUpperCase());

    if (data) {
      return JSON.parse(data) as PageFilter;
    }
    return;
  }

  public removeFilter(page: string): void {
    this.localStorage.removeItem(FILTERS_PAGE + page.toUpperCase());
  }

}
