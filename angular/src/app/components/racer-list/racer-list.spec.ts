import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RacerList } from './racer-list';

describe('RacerList', () => {
  let component: RacerList;
  let fixture: ComponentFixture<RacerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RacerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
