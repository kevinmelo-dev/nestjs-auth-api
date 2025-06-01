// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Variável para armazenar o token JWT para testes sequenciais
  let jwtToken: string;

  const testUserCredentials = {
    username: 'e2euser',
    email: 'e2e@example.com',
    password: 'PasswordE2E123',
  };

  const globalPrefix = '/api/v1'; // Use o prefixo global que você configurou

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Use seu AppModule principal
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Aplicar o mesmo prefixo global e pipes da sua aplicação principal
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Limpar o banco de dados antes de todos os testes desta suíte
    // CUIDADO: Isso apagará dados. Certifique-se de que está apontando para um banco de TESTE.
    await prisma.user.deleteMany({}); // Limpa a tabela de usuários
  });

  afterAll(async () => {
    // Limpar o banco de dados depois de todos os testes (opcional, mas bom)
    await prisma.user.deleteMany({});
    await app.close();
  });

  describe(`${globalPrefix}/auth/register (POST)`, () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/register`)
        .send(testUserCredentials)
        .expect(201) // HttpStatus.CREATED
        .then((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.username).toEqual(testUserCredentials.username);
          expect(res.body.data.email).toEqual(testUserCredentials.email);
          expect(res.body.data.password).toBeUndefined(); // Senha não deve ser retornada
        });
    });

    it('should fail to register if username already exists (409)', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/register`)
        .send({ ...testUserCredentials, email: 'anotheremail@example.com' }) // Mesmo username, email diferente
        .expect(409); // HttpStatus.CONFLICT
    });

    it('should fail to register if email already exists (409)', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/register`)
        .send({ ...testUserCredentials, username: 'anotherusername' }) // Mesmo email, username diferente
        .expect(409); // HttpStatus.CONFLICT
    });

    it('should fail with invalid input (400)', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/register`)
        .send({ username: 'u', email: 'notanemail', password: 'short' })
        .expect(400); // HttpStatus.BAD_REQUEST (devido ao ValidationPipe)
    });
  });

  describe(`${globalPrefix}/auth/login (POST)`, () => {
    it('should login the registered user and return a JWT token', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/login`)
        .send({
          loginIdentifier: testUserCredentials.email,
          password: testUserCredentials.password,
        })
        .expect(200) // HttpStatus.OK
        .then((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.username).toEqual(testUserCredentials.username);
          jwtToken = res.body.accessToken; // Salva o token para usar em outros testes
        });
    });

    it('should fail to login with wrong password (401)', () => {
      return request(app.getHttpServer())
        .post(`${globalPrefix}/auth/login`)
        .send({
          loginIdentifier: testUserCredentials.email,
          password: 'wrongpassword',
        })
        .expect(401); // HttpStatus.UNAUTHORIZED
    });
  });

  describe(`${globalPrefix}/users/me (GET)`, () => {
    it('should fail to get profile if no token is provided (401)', () => {
      return request(app.getHttpServer())
        .get(`${globalPrefix}/users/me`)
        .expect(401);
    });

    it('should get the current user profile with a valid JWT token', () => {
      expect(jwtToken).toBeDefined(); // Garante que o token foi obtido no teste de login
      return request(app.getHttpServer())
        .get(`${globalPrefix}/users/me`)
        .set('Authorization', `Bearer ${jwtToken}`) // Usa o token obtido
        .expect(200)
        .then((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.username).toEqual(testUserCredentials.username);
          expect(res.body.data.email).toEqual(testUserCredentials.email);
        });
    });
  });
});