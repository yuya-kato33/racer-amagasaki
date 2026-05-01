import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TateraceSignage } from './taterace-signage';

describe('TateraceSignage', () => {
  let component: TateraceSignage;
  let fixture: ComponentFixture<TateraceSignage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TateraceSignage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TateraceSignage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
