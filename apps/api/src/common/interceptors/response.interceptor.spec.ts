import { CallHandler, ExecutionContext } from '@nestjs/common'
import { of } from 'rxjs'

import { ResponseInterceptor } from './response.interceptor'

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>

  beforeEach(() => {
    interceptor = new ResponseInterceptor()
  })

  const makeHandler = (data: unknown): CallHandler => ({
    handle: () => of(data),
  })

  it('wraps data in { success: true, data }', (done) => {
    interceptor
      .intercept({} as ExecutionContext, makeHandler({ id: 1 }))
      .subscribe((result) => {
        expect(result).toEqual({ success: true, data: { id: 1 } })
        done()
      })
  })

  it('works with null data', (done) => {
    interceptor
      .intercept({} as ExecutionContext, makeHandler(null))
      .subscribe((result) => {
        expect(result).toEqual({ success: true, data: null })
        done()
      })
  })

  it('works with array data', (done) => {
    interceptor
      .intercept({} as ExecutionContext, makeHandler([1, 2, 3]))
      .subscribe((result) => {
        expect(result).toEqual({ success: true, data: [1, 2, 3] })
        done()
      })
  })
})
