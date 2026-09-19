pipeline {
    agent any

    environment {
        DOCKERHUB = 'rono23'

        FRONTEND_IMAGE = "${DOCKERHUB}/three-tier-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB}/three-tier-backend"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Verify Environment') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo "Docker"
                    echo "========================================"

                    docker --version
                    docker compose version

                    echo ""
                    echo "========================================"
                    echo "Workspace"
                    echo "========================================"

                    pwd
                    ls -la

                    echo ""
                    echo "========================================"
                    echo "Docker access"
                    echo "========================================"

                    docker ps
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set -e

                    echo "Validating docker-compose.yml..."

                    docker compose config > /dev/null

                    echo "Compose configuration is valid."
                '''
            }
        }

        stage('Build Application') {
            steps {
                sh '''
                    set -e

                    echo "Building application..."

                    docker compose build
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    set -e

                    echo "Starting application..."

                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e

                    echo "Waiting for containers..."

                    sleep 10

                    echo ""
                    echo "Container status:"
                    docker compose ps

                    echo ""
                    echo "Checking container health..."

                    FAILED=$(docker compose ps --status exited --quiet)

                    if [ -n "$FAILED" ]; then
                        echo "ERROR: One or more containers exited."
                        docker compose ps
                        docker compose logs --tail=100
                        exit 1
                    fi

                    echo "Application containers are running."
                '''
            }
        }

        stage('Build Release Images') {
            steps {
                sh '''
                    set -e

                    echo "Building release images..."

                    docker build \
                        -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        ./frontend

                    docker build \
                        -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        ./backend

                    echo ""
                    echo "Release images:"
                    docker images | grep -E \
                        "three-tier-frontend|three-tier-backend"
                '''
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    sh '''
                        set -e

                        echo "$DOCKER_TOKEN" | docker login \
                            --username "$DOCKER_USER" \
                            --password-stdin

                        echo "Docker Hub login successful."
                    '''
                }
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                    set -e

                    echo "Pushing frontend image..."
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}

                    echo "Pushing backend image..."
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}

                    echo ""
                    echo "Images pushed successfully:"
                    echo "${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    echo "${BACKEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }
    }

    post {
        success {
            echo """
========================================
BUILD SUCCESSFUL
========================================

Frontend:
${FRONTEND_IMAGE}:${IMAGE_TAG}

Backend:
${BACKEND_IMAGE}:${IMAGE_TAG}

Docker Hub push completed.
========================================
"""
        }

        failure {
            echo """
========================================
BUILD FAILED
========================================

Check the failed stage above.
========================================
"""
        }

        cleanup {
            script {
                sh '''
                    if [ -f docker-compose.yml ]; then
                        echo "Cleaning up Compose containers..."
                        docker compose down || true
                    fi
                '''
            }
        }
    }
}
