import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignagePlay } from './signage-play';

describe('SignagePlay', () => {
  let component: SignagePlay;
  let fixture: ComponentFixture<SignagePlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignagePlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignagePlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
