#!/bin/bash
set -euxo pipefail
cd backend
./gradlew build
cd ..
mv backend/build/libs/backend-1.0.0.jar ./backend.jar
java -jar backend.jar
