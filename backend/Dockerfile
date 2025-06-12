FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# 创建临时目录用于导出Excel文件
RUN mkdir -p temp

EXPOSE 5000

CMD ["npm", "start"]