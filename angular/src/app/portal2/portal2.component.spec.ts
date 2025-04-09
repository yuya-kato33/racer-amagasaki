import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Portal2Component } from './portal2.component';

describe('Portal2Component', () => {
  let component: Portal2Component;
  let fixture: ComponentFixture<Portal2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portal2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Portal2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
