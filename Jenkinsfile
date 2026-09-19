pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        DOCKERHUB = 'rono23'

        FRONTEND_IMAGE = "${DOCKERHUB}/three-tier-frontend"
        BACKEND_IMAGE  = "${DOCKERHUB}/three-tier-backend"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

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
                    echo "Docker Access"
                    echo "========================================"

                    docker ps
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    set -e

                    echo "Validating Docker Compose configuration..."

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

                    echo "Waiting for application..."
                    sleep 10

                    docker compose ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo "Health Check"
                    echo "========================================"

                    docker compose ps

                    echo ""
                    echo "Checking for exited containers..."

                    FAILED=$(docker compose ps --status exited --quiet)

                    if [ -n "$FAILED" ]; then
                        echo "ERROR: One or more containers exited."

                        docker compose ps

                        echo ""
                        echo "Container logs:"
                        docker compose logs --tail=100

                        exit 1
                    fi

                    echo "Health check passed."
                '''
            }
        }

        stage('Build Release Images') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo "Building Release Images"
                    echo "========================================"

                    docker build \
                        -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        ./frontend

                    docker build \
                        -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        ./backend

                    echo ""
                    echo "Images created:"
                    echo "${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    echo "${BACKEND_IMAGE}:${IMAGE_TAG}"
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

                    echo "========================================"
                    echo "Pushing Images"
                    echo "========================================"

                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
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
    }
}
