import { SetCommandOptions } from '@upstash/redis';
import { cacheableFunction } from './cacheable';
import { client } from './client';

describe('cacheableFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['cacheResult'],
    [[1, 2, 3]],
    [{ data: 'cacheResult' }],
    [[{ data: 'cacheResult' }, { data: 'cacheResult2' }, { data: 'cacheResult3' }]],
  ])('should return cached result if available and parse was %s', async (data) => {
    const keyExtractor = jest.fn().mockReturnValue('cacheKey');
    const schema = {
      safeParse: jest.fn().mockReturnValue({ success: true, data }),
    };

    const clientGetSpy = jest.spyOn(client, 'get').mockResolvedValueOnce(JSON.stringify(data));
    const clientSetSpy = jest.spyOn(client, 'set');

    const options: SetCommandOptions = { ex: 3600 };

    const fn = jest.fn().mockResolvedValueOnce('newResult');

    const cachedFn = cacheableFunction(keyExtractor, schema as any, options)(fn);
    const result = await cachedFn({});

    expect(keyExtractor).toHaveBeenCalledWith({});
    expect(clientGetSpy).toHaveBeenCalledWith('cacheKey');
    expect(schema.safeParse).toHaveBeenCalledWith(data);
    expect(fn).not.toHaveBeenCalled();
    expect(clientSetSpy).not.toHaveBeenCalled();
    expect(result).toStrictEqual(data);
  });

  it('should call the original function and cache the result if the parse was not successful', async () => {
    const keyExtractor = jest.fn().mockReturnValue('cacheKey');

    const schema = {
      safeParse: jest.fn().mockReturnValue({ success: false }),
    };

    const options: SetCommandOptions = { ex: 3600 };

    const clientGetSpy = jest.spyOn(client, 'get').mockResolvedValueOnce(JSON.stringify({ data: 'cachedResult' }));
    const clientSetSpy = jest.spyOn(client, 'set');

    const fn = jest.fn().mockResolvedValue('newResult');

    const cachedFn = cacheableFunction(keyExtractor, schema as any, options)(fn);
    const result = await cachedFn({});

    expect(keyExtractor).toHaveBeenCalledWith({});
    expect(clientGetSpy).toHaveBeenCalledWith('cacheKey');
    expect(schema.safeParse).toHaveBeenCalledWith({ data: 'cachedResult' });
    expect(fn).toHaveBeenCalledWith({});
    expect(clientSetSpy).toHaveBeenCalledWith('cacheKey', JSON.stringify('newResult'), options);
    expect(result).toBe('newResult');
  });

  it('should call the original function and cache the result if not available', async () => {
    const keyExtractor = jest.fn().mockReturnValue('cacheKey');

    const schema = {
      safeParse: jest.fn().mockReturnValue({}),
    };

    const options: SetCommandOptions = { ex: 3600 };

    const clientGetSpy = jest.spyOn(client, 'get').mockResolvedValueOnce(null);
    const clientSetSpy = jest.spyOn(client, 'set');

    const fn = jest.fn().mockResolvedValue('newResult');

    const cachedFn = cacheableFunction(keyExtractor, schema as any, options)(fn);
    const result = await cachedFn({});

    expect(keyExtractor).toHaveBeenCalledWith({});
    expect(clientGetSpy).toHaveBeenCalledWith('cacheKey');
    expect(schema.safeParse).not.toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith({});
    expect(clientSetSpy).toHaveBeenCalledWith('cacheKey', JSON.stringify('newResult'), options);
    expect(result).toBe('newResult');
  });
});
