# Étape de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code
COPY . .

# Étape de production
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers nécessaires depuis l'étape de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/config ./config
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/validation ./validation
COPY --from=builder /app/index.js ./

# Créer le dossier pour les logs
RUN mkdir -p /app/logs

# Exposer le port
EXPOSE 3002

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3002

# Commande de démarrage
CMD ["node", "index.js"]