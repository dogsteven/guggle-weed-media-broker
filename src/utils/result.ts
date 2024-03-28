type SuccessResult<T> = {
  status: "success",
  data: T
};

type FailedResult = {
  status: "failed",
  message: any
}

export type Result<T> = SuccessResult<T> | FailedResult;

export function wrapResult<T>(computation: () => T): Result<T> {
  try {
    return {
      status: "success",
      data: computation()
    };
  } catch (error) {
    return {
      status: "failed",
      message: error
    };
  }
}

export async function wrapResultAsync<T>(computation: () => Promise<T>): Promise<Result<T>> {
  try {
    return {
      status: "success",
      data: await computation()
    };
  } catch (error) {
    return {
      status: "failed",
      message: error  
    };
  }
}

export function unwrapResult<T>(result: Result<T>): T {
  if (result.status === "success") {
    return result.data;
  } else {
    throw result.message;
  }
}