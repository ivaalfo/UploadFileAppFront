import { Injectable } from '@angular/core';

//const LAST_TREATED_ARTICLE = 'FT_LAST_TREATED_ARTICLE_V1';
//const LAST_TREATED_CONTAINER = 'FT_LAST_TREATED_CONTAINER_V1';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // ARTICLE
  /*public hasLastTreatedArticle(): boolean {
    return !!localStorage.getItem(LAST_TREATED_ARTICLE);
  }

  public getLastTreatedArticle(): number {
    return parseInt(localStorage.getItem(LAST_TREATED_ARTICLE) || '', 10);
  }

  public setLastTreatedArticle(lastTreatedArticle: number): void {
    localStorage.setItem(LAST_TREATED_ARTICLE, lastTreatedArticle.toString());
  }*/

  // CONTAINER
  /*public hasLastTreatedContainer(): boolean {
    return !!localStorage.getItem(LAST_TREATED_ARTICLE);
  }

  public getLastTreatedContainer(): number {
    return parseInt(localStorage.getItem(LAST_TREATED_CONTAINER) || '', 10);
  }

  public setLastTreatedContainer(lastTreatedContainer: number): void {
    localStorage.setItem(LAST_TREATED_CONTAINER, lastTreatedContainer.toString());
  }*/
}
