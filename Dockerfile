# $REPOSITORY and $IMAGE will be populated on build execution
FROM $REPOSITORY/$IMAGE

COPY build/ ./

CMD ["node", "build/server"]
