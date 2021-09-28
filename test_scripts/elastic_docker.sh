 docker run -d \
 -p 9200:9200 \
 --name=elastic \
 -e "http.host=0.0.0.0" -e "transport.host=127.0.0.1" \
 -e ES_JAVA_OPTS="-Xms256m -Xmx512m" \
 cdap/elastic:latest bash bin/es-docker
