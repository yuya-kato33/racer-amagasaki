import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorPanel } from './selector-panel';

describe('SelectorPanel', () => {
  let component: SelectorPanel;
  let fixture: ComponentFixture<SelectorPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectorPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
