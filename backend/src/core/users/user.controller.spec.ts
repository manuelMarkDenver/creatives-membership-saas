import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { BusinessTypeGuard } from '../guard/business-type.guard';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            getAllUsers: jest.fn(),
            getUsersByTenant: jest.fn(),
            getUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
        {
          provide: BusinessTypeGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    })
      .overrideGuard(BusinessTypeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
