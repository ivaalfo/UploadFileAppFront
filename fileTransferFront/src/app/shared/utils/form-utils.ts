import { SERVER_DATE_FORMAT, DATE_FORMAT } from '@core/services/api/api.constants';
import { FormGroup } from '@angular/forms';
import * as moment from 'moment';

export const error = (fieldName: string, form: FormGroup | undefined, submitted: boolean): string => {
  const control = form ? form.get(fieldName) : null;
  if (control
    && control.invalid
    && (control.dirty || control.touched || submitted)) {

    for (const errorType in control.errors) {
      if (control.errors.hasOwnProperty(errorType)) {
        if (control.errors[errorType]) {
          return 'FORM_ERROR.' + errorType;
        }
      }
    }
  }

  return '';
};

export const getStringValue = (fieldName: string, form: FormGroup | undefined): string => {
  if (!form) {
    return '';
  }
  const field = form.get(fieldName);
  return field ? field.value : '';
};

export const getDateValue = (fieldName: string, form: FormGroup | undefined): string => {
  if (!form) {
    return '';
  }
  const field = form.get(fieldName);
  const momentVariable = moment(field && field.value && field.value.startDate ? field.value.startDate : null, DATE_FORMAT);
  return (momentVariable.isValid()) ? momentVariable.format(SERVER_DATE_FORMAT) : '';
};
