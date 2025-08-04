#!/usr/bin/env node

/**
 * SSL Proxy Server for Nodots Backgammon Development
 *
 * This proxy server provides:
 * - SSL termination with local certificates
 * - Proxy forwarding to local development servers
 * - Support for nodots.home and api.nodots.home domains
 */

import fs from 'fs'
import http from 'http'
import httpProxy from 'http-proxy'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const config = {
  client: {
    domain: 'nodots.home',
    httpsPort: 443,
    httpPort: 80,
    target: 'http://localhost:5437',
  },
  api: {
    domain: 'api.nodots.home',
    httpsPort: 8443,
    httpPort: 8081,
    target: 'http://localhost:3000',
  },
  certs: {
    key: path.join(__dirname, 'certs/domains/nodots.home.key'),
    cert: path.join(__dirname, 'certs/domains/nodots.home.crt'),
    ca: path.join(__dirname, 'certs/ca/ca.crt'),
  },
}

// Validate certificate files exist
function validateCertificates() {
  const requiredFiles = [config.certs.key, config.certs.cert, config.certs.ca]

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Certificate file not found: ${file}`)
      console.error('🔧 Run ./setup-certs.sh first to generate certificates')
      process.exit(1)
    }
  }

  console.log('✅ Certificate files validated')
}

// Create proxy instance
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false, // Allow self-signed certificates on target
  timeout: 30000,
  proxyTimeout: 30000,
})

// Error handling for proxy
proxy.on('error', (err, req, res) => {
  console.error(
    `🚨 Proxy error for ${req.headers.host}${req.url}:`,
    err.message
  )

  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Bad Gateway: Unable to connect to backend server')
  }
})

// Load SSL certificates
function loadSSLOptions() {
  try {
    return {
      key: fs.readFileSync(config.certs.key),
      cert: fs.readFileSync(config.certs.cert),
      ca: fs.readFileSync(config.certs.ca),
    }
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error.message)
    process.exit(1)
  }
}

// Create HTTPS request handler
function createRequestHandler(targetUrl, serviceName) {
  return (req, res) => {
    const startTime = Date.now()

    // Log request
    console.log(
      `📍 ${serviceName}: ${req.method} ${req.headers.host}${req.url}`
    )

    // Add response time logging
    const originalEnd = res.end
    res.end = function (...args) {
      const duration = Date.now() - startTime
      console.log(`⏱️  ${serviceName}: ${res.statusCode} in ${duration}ms`)
      originalEnd.apply(this, args)
    }

    // Proxy the request
    proxy.web(req, res, {
      target: targetUrl,
      changeOrigin: true,
    })
  }
}

// Create HTTP redirect handler
function createRedirectHandler(domain, httpsPort, serviceName) {
  return (req, res) => {
    const httpsUrl =
      httpsPort === 443
        ? `https://${domain}${req.url}`
        : `https://${domain}:${httpsPort}${req.url}`

    console.log(
      `🔄 ${serviceName} Redirect: ${req.headers.host}${req.url} -> ${httpsUrl}`
    )

    res.writeHead(301, {
      Location: httpsUrl,
      'Content-Type': 'text/plain',
    })
    res.end(`Redirecting to ${httpsUrl}`)
  }
}

// Start proxy servers
function startProxyServers() {
  validateCertificates()
  const sslOptions = loadSSLOptions()

  // Client HTTPS proxy (nodots.home -> localhost:5437)
  const clientHttpsServer = https.createServer(
    sslOptions,
    createRequestHandler(config.client.target, 'CLIENT-HTTPS')
  )

  clientHttpsServer.listen(config.client.httpsPort, () => {
    console.log(`🚀 Client HTTPS proxy server running:`)
    console.log(`   https://${config.client.domain} -> ${config.client.target}`)
  })

  // Client HTTP redirect server
  const clientHttpServer = http.createServer(
    createRedirectHandler(
      config.client.domain,
      config.client.httpsPort,
      'CLIENT-HTTP'
    )
  )

  clientHttpServer.listen(config.client.httpPort, () => {
    console.log(`🔄 Client HTTP redirect server running:`)
    console.log(
      `   http://${config.client.domain} -> https://${config.client.domain}`
    )
  })

  // API HTTPS proxy (api.nodots.home -> localhost:3000)
  const apiHttpsServer = https.createServer(
    sslOptions,
    createRequestHandler(config.api.target, 'API-HTTPS')
  )

  apiHttpsServer.listen(config.api.httpsPort, () => {
    console.log(`🚀 API HTTPS proxy server running:`)
    console.log(
      `   https://${config.api.domain}:${config.api.httpsPort} -> ${config.api.target}`
    )
  })

  // API HTTP redirect server
  const apiHttpServer = http.createServer(
    createRedirectHandler(config.api.domain, config.api.httpsPort, 'API-HTTP')
  )

  apiHttpServer.listen(config.api.httpPort, () => {
    console.log(`🔄 API HTTP redirect server running:`)
    console.log(
      `   http://${config.api.domain}:${config.api.httpPort} -> https://${config.api.domain}:${config.api.httpsPort}`
    )
  })

  // Handle graceful shutdown
  const servers = [
    clientHttpsServer,
    clientHttpServer,
    apiHttpsServer,
    apiHttpServer,
  ]

  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down proxy servers...')
    servers.forEach((server) => server.close())
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down proxy servers...')
    servers.forEach((server) => server.close())
    process.exit(0)
  })

  console.log('')
  console.log('📋 Proxy setup complete!')
  console.log('   Make sure to add these entries to /etc/hosts:')
  console.log('   127.0.0.1 nodots.home')
  console.log('   127.0.0.1 api.nodots.home')
  console.log('')
  console.log('📌 Available endpoints:')
  console.log(`   http://${config.client.domain} (redirects to HTTPS)`)
  console.log(`   https://${config.client.domain}`)
  console.log(
    `   http://${config.api.domain}:${config.api.httpPort} (redirects to HTTPS)`
  )
  console.log(`   https://${config.api.domain}:${config.api.httpsPort}`)
  console.log('')
}

// Health check endpoint
function startHealthCheck() {
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'healthy',
          proxies: {
            client: {
              http: `http://${config.client.domain}:${config.client.httpPort}`,
              https: `https://${config.client.domain}:${config.client.httpsPort}`,
            },
            api: {
              http: `http://${config.api.domain}:${config.api.httpPort}`,
              https: `https://${config.api.domain}:${config.api.httpsPort}`,
            },
          },
          targets: {
            client: config.client.target,
            api: config.api.target,
          },
          timestamp: new Date().toISOString(),
        })
      )
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  healthServer.listen(8080, () => {
    console.log(
      '💊 Health check server running on http://localhost:8080/health'
    )
  })
}

// Start all servers
startProxyServers()
startHealthCheck()
