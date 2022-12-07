# Docker

## Build and push image

```bash
docker buildx build --platform linux/amd64,linux/arm64 --push -t solomkinmv/achi_bot .
```

Note: first time create new builder

```bash
docker buildx create --use
```

## Run

Note: use TOKEN env variable for Telegram bot token

```bash
docker run -e TOKEN=$TOKEN solomkinmv/achi_bot  
```
