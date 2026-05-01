FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Note: changed 'build/libs' to 'target' because you are using Maven
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
