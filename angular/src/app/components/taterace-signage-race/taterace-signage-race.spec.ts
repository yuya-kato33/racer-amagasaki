import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TateraceSignageRace } from './taterace-signage-race';

describe('TateraceSignageRace', () => {
  let component: TateraceSignageRace;
  let fixture: ComponentFixture<TateraceSignageRace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TateraceSignageRace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TateraceSignageRace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
