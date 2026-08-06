import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDaterangepickerMd, LocaleConfig, LOCALE_CONFIG } from 'ngx-daterangepicker-material';
import { SortablejsModule } from 'ngx-sortablejs';
import { AngularResizedEventModule } from 'angular-resize-event';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SafeHtmlPipe } from './pipes/safe-html/safe-html.pipe';
import { ActionButtonComponent } from './components/action-button/action-button.component';
import { TableComponent } from './components/table/table.component';
import { CellComponent } from './components/table/cell/cell.component';
import { ActionButtonContainerComponent } from './components/action-button/action-button-container/action-button-container.component';
import { TableHeaderComponent } from './components/table/table-header/table-header.component';
import { TableFilterComponent } from './components/table/table-filter/table-filter.component';
import * as moment from 'moment';
import { RowComponent } from './components/table/row/row.component';
import { ModalComponent } from './components/modal/modal.component';
import { ModalFormComponent } from './components/modal/modal-form/modal-form.component';
import { MultiselectComponent } from './components/multiselect/multiselect.component';
import { ColumnTablesComponent } from '@shared/components/table/column-tables/column-tables.component';
import { ColumnTablesRowComponent } from '@shared/components/table/column-tables-row/column-tables-row.component';
import { DetailTitleComponent } from '@shared/components/detail/detail-title/detail-title.component';
import { DetailBoxComponent } from '@shared/components/detail/detail-box/detail-box.component';
import { TableHorizontalScrollComponent } from '@shared/components/table/table-horizontal-scroll.component';
import { MultiCheckFilterComponent } from '@shared/components/multiCheckFilter/multiCheckFilter.component';
import { HistoricCellComponent } from '@shared/components/table/historic-cell/historic-cell.component';
import { Languages } from '@data/languages';
import { HomeLinkLastWordPipe } from '@shared/pipes/home-link-last-word.pipe/home-link-last-word.pipe';
import { ModalConfirmationComponent } from './components/modal/modal-confirmation/modal-confirmation.component';
import { ModalTableComponent } from './components/modal/modal-table/modal-table/modal-table.component';
import { ExpFilterInputComponent } from './components/expFilter-input/expFilter-input.component';
import { ModalDocsActivComponent } from './components/modal/modal-docs-activ/modal-docs-activ.component';
import { ModalDocsValComponent } from './components/modal/modal-docs-val/modal-docs-val.component';
import { ModalDocsHistComponent } from './components/modal/modal-docs-hist/modal-docs-hist.component';
import { ModalRejectComponent } from './components/modal/modal-reject/modal-reject.component';
import { UserFilterInputComponent } from './components/userFilter-input/userFilter-input.component';
import { FacFilterInputComponent } from './components/facFilter-input/facFilter-input.component';
import { TrackFilterInputComponent } from './components/trackFilter-input/trackFilter-input.component';
import { ModalAnotaComponent } from './components/modal/modal-anota/modal-anota.component';
import { RefCargaFilterInputComponent } from './components/refCargaFilter-input/refCargaFilter-input.component';


moment.locale(Languages.ES);

const datepickerLocaleConfig: LocaleConfig = {
  daysOfWeek: moment.weekdaysMin(),
  monthNames: moment.monthsShort(),
  firstDay: 1,
  applyLabel: 'ok'
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    SortablejsModule,
    AngularResizedEventModule,
    NgxDaterangepickerMd.forRoot()
  ],
  declarations: [
    ActionButtonComponent,
    ActionButtonContainerComponent,
    TableHeaderComponent,
    TableComponent,
    TableHorizontalScrollComponent,
    ColumnTablesComponent,
    RowComponent,
    ColumnTablesRowComponent,
    CellComponent,
    SpinnerComponent,
    ModalComponent,
    ModalFormComponent,
    ModalDocsValComponent,
    ModalRejectComponent,
    ModalAnotaComponent,
    ModalDocsHistComponent,
    ModalDocsActivComponent,
    TableFilterComponent,
    MultiselectComponent,
    DetailTitleComponent,
    DetailBoxComponent,
    SafeHtmlPipe,
    MultiCheckFilterComponent,
    HistoricCellComponent,
    HomeLinkLastWordPipe,
    ModalConfirmationComponent,
    ModalTableComponent,
    ExpFilterInputComponent,
    UserFilterInputComponent,
    FacFilterInputComponent,
    TrackFilterInputComponent,
    RefCargaFilterInputComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    SortablejsModule,
    AngularResizedEventModule,
    MultiCheckFilterComponent,
    ModalConfirmationComponent,
    ActionButtonComponent,
    ActionButtonContainerComponent,
    TableHeaderComponent,
    SpinnerComponent,
    TableComponent,
    TableHorizontalScrollComponent,
    ColumnTablesComponent,
    RowComponent,
    ColumnTablesRowComponent,
    ModalComponent,
    ModalFormComponent,
    ModalDocsActivComponent,
    ModalDocsValComponent,
    ModalDocsHistComponent,
    ModalRejectComponent,
    ModalAnotaComponent,    
    TableFilterComponent,
    CellComponent,
    HistoricCellComponent,
    SafeHtmlPipe,
    NgxDaterangepickerMd,
    MultiselectComponent,
    DetailTitleComponent,
    DetailBoxComponent,
    HomeLinkLastWordPipe,
    ModalTableComponent,
    ExpFilterInputComponent,
    UserFilterInputComponent,
    FacFilterInputComponent,
    TrackFilterInputComponent,
    RefCargaFilterInputComponent
  ],
  providers: [
    { provide: LOCALE_CONFIG, useValue: datepickerLocaleConfig },
    DatePipe, DecimalPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class SharedModule { }
