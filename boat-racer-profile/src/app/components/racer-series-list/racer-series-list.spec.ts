import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RacerSeriesList } from './racer-series-list';

describe('RacerSeriesList', () => {
  let component: RacerSeriesList;
  let fixture: ComponentFixture<RacerSeriesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacerSeriesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RacerSeriesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
