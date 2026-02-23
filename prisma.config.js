"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    schema: './prisma/schema.prisma',
    datasource: {
        url: process.env.DATABASE_URL,
    },
};
