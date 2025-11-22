const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shopping List API',
      version: '1.0.0',
      description: 'API dla aplikacji listy zakupów z funkcjami AI sugestii produktów',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID użytkownika',
            },
            username: {
              type: 'string',
              description: 'Nazwa użytkownika',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email użytkownika',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data utworzenia konta',
            },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID produktu',
            },
            user_id: {
              type: 'integer',
              description: 'ID użytkownika',
            },
            name: {
              type: 'string',
              description: 'Nazwa produktu',
              example: 'Mleko',
            },
            category: {
              type: 'string',
              description: 'Kategoria produktu',
              example: 'Nabiał',
            },
            quantity: {
              type: 'integer',
              description: 'Ilość',
              default: 1,
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Cena produktu',
              nullable: true,
            },
            bought: {
              type: 'integer',
              description: 'Czy produkt został kupiony (0 - nie, 1 - tak)',
              default: 0,
            },
            bought_date: {
              type: 'string',
              format: 'date-time',
              description: 'Data zakupu',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data utworzenia',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Nazwa użytkownika',
              example: 'jan_kowalski',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email użytkownika',
              example: 'jan@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Hasło (minimum 6 znaków)',
              minLength: 6,
              example: 'securepassword123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Nazwa użytkownika lub email',
              example: 'jan_kowalski',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Hasło',
              example: 'securepassword123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful',
            },
            token: {
              type: 'string',
              description: 'JWT token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        ItemRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Nazwa produktu (wymagane)',
              example: 'Mleko',
            },
            category: {
              type: 'string',
              description: 'Kategoria produktu (opcjonalne, domyślnie "Inne")',
              example: 'Nabiał',
            },
            quantity: {
              type: 'integer',
              description: 'Ilość (opcjonalne, domyślnie 1)',
              default: 1,
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Cena (opcjonalne)',
              example: 4.99,
            },
          },
        },
        ItemUpdateRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Nazwa produktu',
            },
            category: {
              type: 'string',
              description: 'Kategoria produktu',
            },
            quantity: {
              type: 'integer',
              description: 'Ilość',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Cena',
            },
            bought: {
              type: 'integer',
              description: 'Czy produkt został kupiony (0 - nie, 1 - tak)',
              enum: [0, 1],
            },
          },
        },
        AISuggestionsRequest: {
          type: 'object',
          properties: {
            currentItems: {
              type: 'array',
              description: 'Lista aktualnych produktów na liście (opcjonalne)',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  category: {
                    type: 'string',
                  },
                },
              },
              default: [],
            },
          },
        },
        Suggestion: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Nazwa sugerowanego produktu',
            },
            category: {
              type: 'string',
              description: 'Kategoria produktu',
            },
            reason: {
              type: 'string',
              description: 'Powód sugestii',
            },
            score: {
              type: 'integer',
              description: 'Wynik sugestii',
            },
            type: {
              type: 'string',
              enum: ['regular', 'overdue', 'category', 'complementary'],
              description: 'Typ sugestii',
            },
          },
        },
        AISuggestionsResponse: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              description: 'Wszystkie sugestie (top 10)',
              items: {
                $ref: '#/components/schemas/Suggestion',
              },
            },
            regular: {
              type: 'array',
              description: 'Produkty kupowane regularnie',
              items: {
                $ref: '#/components/schemas/Suggestion',
              },
            },
            overdue: {
              type: 'array',
              description: 'Produkty przeterminowane (nie kupowane >7 dni)',
              items: {
                $ref: '#/components/schemas/Suggestion',
              },
            },
            category: {
              type: 'array',
              description: 'Sugestie na podstawie kategorii',
              items: {
                $ref: '#/components/schemas/Suggestion',
              },
            },
            complementary: {
              type: 'array',
              description: 'Produkty komplementarne (często kupowane razem)',
              items: {
                $ref: '#/components/schemas/Suggestion',
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Komunikat błędu',
            },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Komunikat sukcesu',
            },
            count: {
              type: 'integer',
              description: 'Liczba usuniętych elementów (tylko dla DELETE /api/items)',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./index.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

