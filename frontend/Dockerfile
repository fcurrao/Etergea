# Etapa 1: Construir la aplicación Angular
FROM node:18 AS build

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de la aplicación Angular al contenedor
COPY package.json ./

# Instalar las dependencias de la aplicación Angular
RUN npm install

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Establecer la variable de entorno para solucionar el problema de OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copiar el resto de los archivos de la aplicación Angular al contenedor
COPY . .

# Construir la aplicación Angular
RUN npm run build --prod

# Etapa 2: Servir la aplicación con un servidor web
FROM nginx:alpine

# Copiar los archivos construidos de la aplicación Angular desde la etapa anterior
COPY --from=build /app/dist/etergea-front /usr/share/nginx/html

# Exponer el puerto 80 para servir la aplicación Angular
EXPOSE 80

# Comando para ejecutar Nginx
CMD ["nginx", "-g", "daemon off;"]