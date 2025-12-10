# Developer Guide - Adding New Features

**Project:** Labyrinth Nexus API
**Framework:** NestJS 11.0
**Database:** PostgreSQL + Prisma ORM + Liquibase Migrations
**Last Updated:** 2025-12-10

---

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Project Architecture](#project-architecture)
3. [Adding a New Resource (Complete Guide)](#adding-a-new-resource-complete-guide)
4. [Database Workflow](#database-workflow)
5. [Authentication & Authorization](#authentication--authorization)
6. [Testing Guidelines](#testing-guidelines)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

---

## Naming Conventions

### File Naming

**Pattern:** `kebab-case` for all files

| File Type | Pattern | Example |
|-----------|---------|---------|
| Controllers | `{resource}.controller.ts` | `user.controller.ts` |
| Services | `{resource}.service.ts` | `user.service.ts` |
| Modules | `{resource}.module.ts` | `user.module.ts` |
| DTOs | `{action}-{resource}.dto.ts` | `create-user.dto.ts` |
| Interfaces | `{name}.interface.ts` | `auth-result.interface.ts` |
| Guards | `{name}.guard.ts` | `jwt-auth.guard.ts` |
| Decorators | `{name}.decorator.ts` | `current-user.decorator.ts` |
| Middlewares | `{name}.middleware.ts` | `security.middleware.ts` |
| Filters | `{name}.filter.ts` | `prisma-exception.filter.ts` |
| Interceptors | `{name}.interceptor.ts` | `logging.interceptor.ts` |
| Utilities | `{name}.util.ts` | `transform-user.util.ts` |
| Selects | `{name}.select.ts` | `safe-user-select.ts` |
| Test Files | `{name}.spec.ts` | `user.service.spec.ts` |
| E2E Tests | `{name}.e2e-spec.ts` | `auth.e2e-spec.ts` |

### Class Naming

**Pattern:** `PascalCase`

| Type | Pattern | Example |
|------|---------|---------|
| Controllers | `{Resource}Controller` | `UserController` |
| Services | `{Resource}Service` | `UserService` |
| Modules | `{Resource}Module` | `UserModule` |
| DTOs | `{Action}{Resource}Dto` | `CreateUserDto` |
| Interfaces | `{Name}Interface` or `I{Name}` | `AuthResultInterface` |
| Guards | `{Name}Guard` | `JwtAuthGuard` |
| Decorators | No specific suffix | `Public`, `Roles`, `CurrentUser` |
| Exceptions | `{Name}Exception` | `UserNotFoundException` |

### Variable & Function Naming

**Pattern:** `camelCase`

```typescript
// Variables
const userId = '123';
const isActive = true;
const userRoles = ['ADMIN', 'USER'];

// Functions/Methods
async findUserById(id: string) { }
async createNewSession(data: CreateSessionDto) { }
validatePassword(password: string) { }

// Boolean variables/functions - use "is", "has", "should", "can"
const isAuthenticated = true;
const hasPermission = false;
function canAccessResource() { }
function shouldRetry() { }
```

### Constants

**Pattern:** `SCREAMING_SNAKE_CASE`

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 10;
const JWT_EXPIRY_MINUTES = 15;
const COOKIE_MAX_AGE = 604800000;
```

### Prisma Schema Naming

| Element | Pattern | Example |
|---------|---------|---------|
| Model Names | `PascalCase` (singular) | `User`, `Session`, `Role` |
| Field Names | `camelCase` | `firstName`, `createdAt`, `isActive` |
| Database Tables | `snake_case` (via @map) | `user`, `session`, `user_role` |
| Database Columns | `snake_case` (via @map) | `first_name`, `created_at`, `is_active` |
| Relations | `camelCase` (plural for many) | `sessions`, `userRoles` |
| Indexes | `idx_{table}_{column(s)}` | `idx_user_email`, `idx_session_user_id` |
| Foreign Keys | `fk_{table}_{column}` | `fk_session_user_id` |
| Unique Constraints | `uq_{table}_{column(s)}` | `uq_user_email` |

### Database Migration Naming

**Pattern:** `{number}-{description}.xml`

```
001-create-user-table.xml
002-create-role-table.xml
003-create-session-table.xml
004-seed-role-data.xml
005-add-user-phone-field.xml
```

### Environment Variables

**Pattern:** `SCREAMING_SNAKE_CASE`

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
DB_USER=postgres
```

### API Endpoint Naming

**Pattern:** `kebab-case`, RESTful conventions

```
GET    /api/users              # List all users
GET    /api/users/:id          # Get specific user
POST   /api/users              # Create user
PATCH  /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
PATCH  /api/users/:id/password # Update user password (sub-resource)
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
GET    /api/auth/me            # Get current user
```

---

## Project Architecture

### Module Structure

```
src/
├── {module-name}/              # Feature module
│   ├── dto/                    # Data Transfer Objects
│   │   ├── create-{resource}.dto.ts
│   │   ├── update-{resource}.dto.ts
│   │   └── find-all-{resource}.dto.ts
│   ├── guards/                 # Module-specific guards (optional)
│   ├── decorators/             # Module-specific decorators (optional)
│   ├── interfaces/             # TypeScript interfaces (optional)
│   ├── selects/                # Prisma select objects (optional)
│   ├── utils/                  # Utility functions (optional)
│   ├── {resource}.controller.ts
│   ├── {resource}.service.ts
│   ├── {resource}.module.ts
│   ├── {resource}.controller.spec.ts
│   └── {resource}.service.spec.ts
├── shared/                     # Shared utilities
│   ├── configs/
│   ├── dto/
│   ├── filters/
│   ├── interceptors/
│   ├── middlewares/
│   └── services/
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```

### Standard Module Components

1. **Module** - Declares and imports dependencies
2. **Controller** - Handles HTTP requests and routing
3. **Service** - Business logic and data operations
4. **DTOs** - Input validation and transformation
5. **Tests** - Unit tests for service and controller
6. **Selects** (optional) - Prisma query selections
7. **Utils** (optional) - Helper functions

---

## Adding a New Resource (Complete Guide)

Let's add a complete new feature: **Products** (for an e-commerce example)

### Step 1: Database Schema (Liquibase + Prisma)

#### 1.1 Create Liquibase Migration

Create `db/migration-scripts/006-create-product-table.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

  <changeSet id="6" author="yourname">
    <createTable tableName="product">
      <column name="id" type="UUID" defaultValueComputed="gen_random_uuid()">
        <constraints primaryKey="true" nullable="false"/>
      </column>
      <column name="name" type="VARCHAR(255)">
        <constraints nullable="false"/>
      </column>
      <column name="description" type="TEXT"/>
      <column name="price" type="DECIMAL(10,2)">
        <constraints nullable="false"/>
      </column>
      <column name="stock_quantity" type="INTEGER" defaultValueNumeric="0">
        <constraints nullable="false"/>
      </column>
      <column name="sku" type="VARCHAR(100)">
        <constraints unique="true" nullable="false"/>
      </column>
      <column name="is_active" type="BOOLEAN" defaultValueBoolean="true">
        <constraints nullable="false"/>
      </column>
      <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
        <constraints nullable="false"/>
      </column>
      <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
        <constraints nullable="false"/>
      </column>
      <column name="created_by" type="UUID">
        <constraints foreignKeyName="fk_product_created_by"
                     references="user(id)" nullable="true"/>
      </column>
    </createTable>

    <!-- Indexes -->
    <createIndex indexName="idx_product_sku" tableName="product">
      <column name="sku"/>
    </createIndex>

    <createIndex indexName="idx_product_is_active" tableName="product">
      <column name="is_active"/>
    </createIndex>
  </changeSet>

</databaseChangeLog>
```

#### 1.2 Add to Changelog Master

Edit `db/db.changelog-master.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog ...>
  <include file="migration-scripts/001-create-user-table.xml"/>
  <include file="migration-scripts/002-create-role-table.xml"/>
  <include file="migration-scripts/003-create-session-table.xml"/>
  <include file="migration-scripts/004-seed-role-data.xml"/>
  <include file="migration-scripts/005-create-user-role-table.xml"/>
  <include file="migration-scripts/006-create-product-table.xml"/> <!-- ADD THIS -->
</databaseChangeLog>
```

#### 1.3 Run Migration

```bash
# Development
npm run liquibase:update-dev

# Pull schema to Prisma
npm run prisma:db-pull

# Generate Prisma Client
npm run prisma:generate
```

#### 1.4 Verify Prisma Schema

Check `prisma/schema.prisma` - Prisma should have auto-generated:

```prisma
model Product {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String    @db.VarChar(255)
  description   String?
  price         Decimal   @db.Decimal(10, 2)
  stockQuantity Int       @default(0) @map("stock_quantity")
  sku           String    @unique @db.VarChar(100)
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt     DateTime  @default(now()) @map("updated_at") @db.Timestamp(6)
  createdBy     String?   @map("created_by") @db.Uuid

  creator       User?     @relation(fields: [createdBy], references: [id])

  @@index([sku], map: "idx_product_sku")
  @@index([isActive], map: "idx_product_is_active")
  @@map("product")
}

// Also add to User model:
model User {
  // ... existing fields
  productsCreated Product[]
}
```

---

### Step 2: Create Module Structure

```bash
# Create directories
mkdir src/product
mkdir src/product/dto
mkdir src/product/selects
mkdir src/product/utils
```

---

### Step 3: Create DTOs

#### `src/product/dto/create-product.dto.ts`

```typescript
import { IsString, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stockQuantity: number;

  @IsString()
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

#### `src/product/dto/update-product.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

#### `src/product/dto/find-all-products.dto.ts`

```typescript
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class FindAllProductsDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string; // Search by name or SKU
}
```

---

### Step 4: Create Prisma Selects

#### `src/product/selects/product-select.ts`

```typescript
import { Prisma } from '../../../generated/prisma';

export const productSelect: Prisma.ProductSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stockQuantity: true,
  sku: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  creator: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
};
```

#### `src/product/selects/safe-product-select.ts`

```typescript
import { Prisma } from '../../../generated/prisma';

// Excludes sensitive fields like createdBy for public APIs
export const safeProductSelect: Prisma.ProductSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stockQuantity: true,
  sku: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};
```

---

### Step 5: Create Service

#### `src/product/product.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { productSelect } from './selects/product-select';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    // Check if SKU already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        createdBy: userId,
      },
      select: productSelect,
    });
  }

  async findAll(query: FindAllProductsDto) {
    const { skip = 0, take = 10, isActive, search } = query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: productSelect,
        skip: skip,
        take: take === 0 ? undefined : take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    await this.findOne(id);

    // If SKU is being updated, check uniqueness
    if (updateProductDto.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        updatedAt: new Date(),
      },
      select: productSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: product.stockQuantity + quantity,
        updatedAt: new Date(),
      },
      select: productSelect,
    });
  }
}
```

---

### Step 6: Create Controller

#### `src/product/product.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productService.create(createProductDto, userId);
  }

  @Get()
  @Public()
  findAll(@Query() query: FindAllProductsDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id/stock')
  @Roles('ADMIN')
  updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productService.updateStock(id, quantity);
  }
}
```

---

### Step 7: Create Module

#### `src/product/product.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService], // Export if other modules need it
})
export class ProductModule {}
```

---

### Step 8: Register in App Module

#### `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// ... other imports
import { ProductModule } from './product/product.module'; // ADD THIS

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
    }),
    // ... other modules
    ProductModule, // ADD THIS
  ],
  // ...
})
export class AppModule {}
```

---

### Step 9: Create Tests

#### `src/product/product.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../shared/services/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stockQuantity: 10,
      sku: 'TEST-001',
      isActive: true,
    };

    const userId = 'user-id-123';

    it('should create a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: 'product-id',
        ...createDto,
        createdBy: userId,
      });

      const result = await service.create(createDto, userId);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: { ...createDto, createdBy: userId },
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException if SKU exists', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'existing-id',
        sku: createDto.sku,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const mockProduct = { id: '1', name: 'Test Product' };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(2);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toEqual({ data: mockProducts, total: 2 });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const mockProduct = { id: '1', name: 'Old Name' };
      const updateDto = { name: 'New Name' };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update('1', updateDto);

      expect(result.name).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const mockProduct = { id: '1', name: 'Product' };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      await service.remove('1');

      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
```

#### `src/product/product.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'Test',
        price: 99.99,
        stockQuantity: 10,
        sku: 'TEST-001',
      };
      const userId = 'user-123';

      mockProductService.create.mockResolvedValue({ id: '1', ...createDto });

      const result = await controller.create(createDto as any, userId);

      expect(service.create).toHaveBeenCalledWith(createDto, userId);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query = { skip: 0, take: 10 };
      const mockResponse = { data: [], total: 0 };

      mockProductService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const mockProduct = { id: '1', name: 'Test' };

      mockProductService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated' };
      const mockProduct = { id: '1', ...updateDto };

      mockProductService.update.mockResolvedValue(mockProduct);

      const result = await controller.update('1', updateDto as any);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockProductService.remove.mockResolvedValue({ id: '1' });

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
```

---

### Step 10: Test Your New Feature

```bash
# Run unit tests
npm run test

# Run specific test file
npm run test product.service.spec.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Test manually
npm run start:dev

# Test endpoints
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/some-id
```

---

## Database Workflow

### Making Schema Changes

```bash
# 1. Create Liquibase migration XML file
#    db/migration-scripts/{number}-{description}.xml

# 2. Add to db.changelog-master.xml
#    <include file="migration-scripts/{your-file}.xml"/>

# 3. Run migration
npm run liquibase:update-dev

# 4. Pull schema to Prisma
npm run prisma:db-pull

# 5. Review prisma/schema.prisma
#    Adjust @map annotations if needed

# 6. Generate Prisma Client
npm run prisma:generate

# 7. Restart your application
npm run start:dev
```

### Rollback Migrations

```bash
# Rollback last changeset
npm run liquibase:rollback-dev

# Then regenerate Prisma
npm run prisma:db-pull
npm run prisma:generate
```

---

## Authentication & Authorization

### Public Routes

```typescript
@Get()
@Public() // Anyone can access
findAll() {
  return this.service.findAll();
}
```

### Authenticated Routes (Any Logged-in User)

```typescript
@Get('me')
@UseGuards(JwtAuthGuard) // Requires authentication
getCurrentUser(@CurrentUser() user) {
  return user;
}
```

### Role-Based Access

```typescript
@Post()
@Roles('ADMIN') // Only ADMIN role can access
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() createDto: CreateDto) {
  return this.service.create(createDto);
}
```

### Multiple Roles

```typescript
@Patch(':id')
@Roles('ADMIN', 'MODERATOR') // Either ADMIN or MODERATOR
@UseGuards(JwtAuthGuard, RolesGuard)
update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
  return this.service.update(id, updateDto);
}
```

### Get Current User Data

```typescript
@Get('my-products')
@UseGuards(JwtAuthGuard)
getMyProducts(@CurrentUser('id') userId: string) {
  return this.service.findByUserId(userId);
}

// Or get full user object
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  console.log(user); // { id, email, roles, ... }
  return user;
}
```

---

## Testing Guidelines

### Unit Test Structure

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyName;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      const mockData = { };
      dependency.method.mockResolvedValue(mockData);

      // Act
      const result = await service.method();

      // Assert
      expect(result).toEqual(mockData);
      expect(dependency.method).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error when condition', async () => {
      // Arrange
      dependency.method.mockRejectedValue(new Error('error'));

      // Act & Assert
      await expect(service.method()).rejects.toThrow('error');
    });
  });
});
```

### Test Coverage Goals

- Services: > 80%
- Controllers: > 70%
- Critical paths: 100%

---

## Best Practices

### 1. Always Use DTOs for Input Validation

```typescript
// ❌ Bad
@Post()
create(@Body() data: any) {
  return this.service.create(data);
}

// ✅ Good
@Post()
create(@Body() createDto: CreateProductDto) {
  return this.service.create(createDto);
}
```

### 2. Use Prisma Select Objects

```typescript
// ❌ Bad - returns everything including sensitive data
const user = await this.prisma.user.findUnique({ where: { id } });

// ✅ Good - only returns what you need
const user = await this.prisma.user.findUnique({
  where: { id },
  select: safeUserSelect,
});
```

### 3. Return Consistent Response Format

```typescript
// ✅ For lists
return {
  data: items,
  total: count,
};

// ✅ For single items
return item;

// ✅ For delete operations
return { message: 'Deleted successfully' };
```

### 4. Handle Errors Properly

```typescript
// ❌ Bad
const user = await this.prisma.user.findUnique({ where: { id } });
return user; // Could be null!

// ✅ Good
const user = await this.prisma.user.findUnique({ where: { id } });
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}
return user;
```

### 5. Use Transactions for Multiple Operations

```typescript
return this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: quantity } },
  });
  return order;
});
```

### 6. Pagination Best Practices

```typescript
async findAll(query: FindAllDto) {
  const { skip = 0, take = 10 } = query;

  const [data, total] = await Promise.all([
    this.prisma.model.findMany({
      skip,
      take: take === 0 ? undefined : take, // 0 = all records
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.model.count(),
  ]);

  return { data, total };
}
```

### 7. Sanitize Logs

The logging interceptor already sanitizes sensitive fields. Add any custom sensitive fields to the list:

```typescript
// src/shared/interceptors/logging.interceptor.ts
private readonly sensitiveFields = [
  'password',
  'token',
  'secret',
  'yourCustomSensitiveField', // Add here
];
```

---

## Common Patterns

### Pattern 1: Soft Delete

```typescript
// In Prisma schema
model Product {
  // ... fields
  isDeleted   Boolean   @default(false) @map("is_deleted")
  deletedAt   DateTime? @map("deleted_at")
}

// In service
async remove(id: string) {
  return this.prisma.product.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

// When querying, exclude deleted
async findAll() {
  return this.prisma.product.findMany({
    where: { isDeleted: false },
  });
}
```

### Pattern 2: Audit Fields

```typescript
// In Prisma schema
model Product {
  // ... fields
  createdBy   String?   @map("created_by") @db.Uuid
  updatedBy   String?   @map("updated_by") @db.Uuid
  creator     User?     @relation("CreatedProducts", fields: [createdBy], references: [id])
  updater     User?     @relation("UpdatedProducts", fields: [updatedBy], references: [id])
}

// In service
async create(dto: CreateDto, userId: string) {
  return this.prisma.product.create({
    data: {
      ...dto,
      createdBy: userId,
    },
  });
}

async update(id: string, dto: UpdateDto, userId: string) {
  return this.prisma.product.update({
    where: { id },
    data: {
      ...dto,
      updatedBy: userId,
      updatedAt: new Date(),
    },
  });
}
```

### Pattern 3: Search & Filter

```typescript
async findAll(query: FindAllDto) {
  const { skip, take, search, isActive, minPrice, maxPrice } = query;

  const where: any = {};

  // Boolean filter
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Range filter
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  // Text search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    this.prisma.product.findMany({
      where,
      skip,
      take: take === 0 ? undefined : take,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.product.count({ where }),
  ]);

  return { data, total };
}
```

### Pattern 4: Conditional Updates

```typescript
async update(id: string, dto: UpdateDto, currentUserId: string) {
  const product = await this.findOne(id);

  // Only creator or admin can update
  if (product.createdBy !== currentUserId && !isAdmin) {
    throw new ForbiddenException('You can only update your own products');
  }

  return this.prisma.product.update({
    where: { id },
    data: {
      ...dto,
      updatedBy: currentUserId,
      updatedAt: new Date(),
    },
  });
}
```

### Pattern 5: Cascade Operations

```typescript
// Delete product and all related records
async remove(id: string) {
  return this.prisma.$transaction(async (tx) => {
    // Delete related records first
    await tx.orderItem.deleteMany({ where: { productId: id } });
    await tx.review.deleteMany({ where: { productId: id } });

    // Then delete product
    return tx.product.delete({ where: { id } });
  });
}
```

---

## Quick Reference Checklist

When adding a new feature, make sure you:

- [ ] Create Liquibase migration XML
- [ ] Add to db.changelog-master.xml
- [ ] Run migrations and generate Prisma
- [ ] Create DTOs with validation
- [ ] Create service with business logic
- [ ] Create controller with routes
- [ ] Create module and register in AppModule
- [ ] Add authentication/authorization guards
- [ ] Create Prisma select objects
- [ ] Write unit tests (service & controller)
- [ ] Test endpoints manually
- [ ] Update documentation

---

## Need Help?

- Review existing modules (user, auth, session, role) for examples
- Check `CODEBASE_REVIEW.md` for optimization tips
- See `CRITICAL_FIXES_APPLIED.md` for security guidelines
- Run tests: `npm run test`
- Check logs: `docker-compose logs -f api`

---

**Happy Coding! 🚀**
