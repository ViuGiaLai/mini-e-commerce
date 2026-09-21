# Thực hành Docker: Container hóa web đơn giản

## 1. Build image

Mở terminal tại thư mục chứa `Dockerfile` và chạy:

```bash
docker build -t docker-web-demo:1.0 .
```

Kiểm tra image:

```bash
docker images
```

## 2. Chạy container

```bash
docker run -d --name docker-web-container -p 8080:80 docker-web-demo:1.0
```

Mở trình duyệt tại [http://localhost:8080](http://localhost:8080).

## 3. Quản lý container

```bash
docker ps
docker ps -a
docker stop docker-web-container
docker start docker-web-container
docker restart docker-web-container
docker rm docker-web-container
```

Nếu container đang chạy, dùng `docker rm -f docker-web-container` để dừng và xóa trong một lệnh.

## 4. Xóa image

```bash
docker rmi docker-web-demo:1.0
```

## 5. Đẩy image lên Docker Hub

Thay `DOCKERHUB_USERNAME` bằng tên tài khoản Docker Hub của bạn:

```bash
docker login
docker tag docker-web-demo:1.0 DOCKERHUB_USERNAME/docker-web-demo:1.0
docker push DOCKERHUB_USERNAME/docker-web-demo:1.0
```

Người khác có thể chạy image bằng:

```bash
docker run -d --name docker-web-container -p 8080:80 DOCKERHUB_USERNAME/docker-web-demo:1.0
```
