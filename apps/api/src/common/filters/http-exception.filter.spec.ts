import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

import { HttpExceptionFilter } from './http-exception.filter'

const makeHost = (url = '/test'): ArgumentsHost => {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter

  beforeEach(() => {
    filter = new HttpExceptionFilter()
  })

  it('uses HttpException status and message', () => {
    const host = makeHost('/auth/login')
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    const http = host.switchToHttp()
    const json = jest.fn()
    const statusFn = jest.fn().mockReturnValue({ json })
    ;(http.getResponse as jest.Mock) = jest.fn().mockReturnValue({ status: statusFn })

    filter.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn }),
        getRequest: () => ({ url: '/auth/login' }),
      }),
    } as unknown as ArgumentsHost)

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        path: '/auth/login',
        message: 'Unauthorized',
      }),
    )
  })

  it('uses 500 status for non-HttpException errors', () => {
    const json = jest.fn()
    const statusFn = jest.fn().mockReturnValue({ json })

    filter.catch(new Error('Unexpected crash'), {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn }),
        getRequest: () => ({ url: '/some/path' }),
      }),
    } as unknown as ArgumentsHost)

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      }),
    )
  })

  it('includes timestamp and path in response', () => {
    const json = jest.fn()
    const statusFn = jest.fn().mockReturnValue({ json })

    filter.catch(new HttpException('Not Found', 404), {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn }),
        getRequest: () => ({ url: '/resource/123' }),
      }),
    } as unknown as ArgumentsHost)

    const payload = json.mock.calls[0][0]
    expect(payload.timestamp).toBeDefined()
    expect(payload.path).toBe('/resource/123')
  })

  it('extracts message from object response (NestJS validation errors)', () => {
    const json = jest.fn()
    const statusFn = jest.fn().mockReturnValue({ json })
    const exception = new HttpException({ message: 'Validation failed', error: 'Bad Request' }, 400)

    filter.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn }),
        getRequest: () => ({ url: '/users' }),
      }),
    } as unknown as ArgumentsHost)

    const payload = json.mock.calls[0][0]
    expect(payload.message).toBe('Validation failed')
  })
})
