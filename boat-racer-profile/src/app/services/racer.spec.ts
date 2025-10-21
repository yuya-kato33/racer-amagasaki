import { TestBed } from '@angular/core/testing';

import { Racer } from './racer';

describe('Racer', () => {
  let service: Racer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Racer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
