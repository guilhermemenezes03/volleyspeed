"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    schema: './schema.prisma',
    database: {
        adapter: 'postgresql',
        url: process.env.DATABASE_URL,
    },
};
