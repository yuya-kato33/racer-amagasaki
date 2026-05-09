import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TateraceSignagePage } from './taterace-signage-page';

describe('TateraceSignagePage', () => {
  let component: TateraceSignagePage;
  let fixture: ComponentFixture<TateraceSignagePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TateraceSignagePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TateraceSignagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
