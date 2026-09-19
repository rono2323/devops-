pipeline {
    agent any

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

        stage('Verify') {
            steps {
                sh '''
                    echo "Docker version:"
                    docker --version

                    echo "Docker Compose version:"
                    docker compose version

                    echo "Project files:"
                    ls -la
                '''
            }
        }

        stage('Build Application') {
            steps {
                sh '''
                    docker compose build
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 10

                    docker compose ps
                '''
            }
        }

        stage('Build Release Images') {
            steps {
                sh """
                    docker build \
                      -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                      ./frontend

                    docker build \
                      -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                      ./backend
                """
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
                        echo "$DOCKER_TOKEN" | \
                        docker login \
                        -u "$DOCKER_USER" \
                        --password-stdin
                    '''
                }
            }
        }

        stage('Push Images') {
            steps {
                sh """
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                """
            }
        }
    }

    post {
        always {
            sh '''
                docker compose down || true
            '''
        }

        success {
            echo "========================================"
            echo "BUILD SUCCESSFUL"
            echo "Frontend: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            echo "Backend:  ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "========================================"
        }

        failure {
            echo "BUILD FAILED"
        }
    }
}
